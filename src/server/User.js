{
  const $User = function (db, user, roles) {
    /** Self construct */
    if (!(this instanceof $User)) return new $User(db, user, roles);

    /** Private constant */
    const _logger = $Log(`USER`);

    const userSchema = $Schema({
      '!db': DB,
      '!user': "string",
      '!roles': $Role,
    });

    /** Private variable */
    let userObj = null;
    let srvUserObj = null;
    let passwd = '';

    /** Basic function */
    const _toString = () => {
      if (!userObj) {
        return `Invalid [$User]`;
      }
      return `[$User] ${userObj.db._name}.${userObj.user}`;
    };
    const _valueOf = () => {
      if (!srvUserObj) return null;
      return `\
${srvUserObj.db._name}.${srvUserObj.user}
(${srvUserObj.roles.sort().join(', ')})`;
    };

    /** Private function */
    const _parseUserObj = (obj) => {
      if (!obj.roles) {
        obj.roles = [];
      }
      if (!userSchema.test(obj)) {
        _logger.err(`Audit`, `Invalid input data for user object`);
        return null;
      }
      return obj;
    };
    const _genData = () => {
      if ($User.is$User(db)) {
        userObj = _parseUserObj(db.getRaw());
        return; 
      }
      if (userSchema.test(db)) {
        userObj = _parseUserObj(db);
        return;
      }
      const data = {
        db        : db,
        user      : user,
        roles     : $Object.toArrayIfNot(roles).filter($Check.isNotNull).map($Role).sort(),
      };
      userObj = _parseUserObj(data);
    };
    const _getRaw = () => {
      return userObj;
    };
    const _getRef = () => {
      if (!userObj) return null;
      return {
        user: userObj.user,
        db  : userObj.db._name,
      };
    };
    const _getDef = () => {
      if (!userObj) return null;
      return {
        user  : userObj.user,
        db    : userObj.db._name,
        roles : userObj.roles.map($Role.getRef).filter($Check.isNotNull),
      };
    };
    const _mapUserDB = (obj) => {
      obj.db = userObj.db.getSiblingDB(obj.db);
      return obj;
    }
    const _loadServerUser = () => {
      const title = `ServerUser`;
      if (userObj == null) return;
      const cmd = {
        usersInfo: userObj.user,
      };
      const res = userObj.db.runCommand(cmd);
      if (!res.ok) {
        _logger.err(title, res.errmsg);
        srvUserObj = null;
        return;
      }
      if (res.users.length == 0) {
        _logger.warn(title, `[${userObj.user}] user does not exists on server.`);
        srvUserObj = null;
        return;
      }
      const data = res.users[0];
      data.db = userObj.db.getSiblingDB(data.db);
      data.roles = data.roles.map(_mapUserDB).map($Role);
      delete data._id;
      delete data.userId;
      delete data.mechanisms;
      srvUserObj = _parseUserObj(data);
    };
    const _getSrv = () => {
      _loadServerUser();
      return srvUserObj;
    };
    const _syncUser = () => {
      const title = `Sync`;
      _loadServerUser();
      if (!srvUserObj) {
        _logger.warn(title, `Error loading server user. Local user is not synced.`);
        return;
      }
      if (userObj == srvUserObj) {
        _logger.info(title, `Local role has already matched with server.`);
        return;
      }
      userObj = srvUserObj;
    };
    const _deployGrantedRoles = () => {
      const title = `GrantRoles`;
      const cmd = {
        grantRolesToUser: srvUserObj.user,
        writeConcern: {w: `majority`},
      };
      const granting = userObj.roles.filter($Object.filterNotEqualUsingValueOf, {arr: srvUserObj.roles});
      if (granting.length > 0) {
        cmd.roles = granting.map($Role.getRef);
        const res = srvUserObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles granted to [${cmd.grantRolesToUser}]`);
      }
    };
    const _deployGrantedUser = () => {
      _loadServerUser();
      if (!srvUserObj) return;
      _deployGrantedRoles();
    };
    const _deployRevokedRoles = () => {
      const title = `RevokeRoles`;
      const cmd = {
        revokeRolesFromUser: srvUserObj.user,
        writeConcern: {w: `majority`},
      };
      const revoking = srvUserObj.roles.filter($Object.filterNotEqualUsingValueOf, {arr: userObj.roles});
      if (revoking.length > 0) {
        cmd.roles = revoking.map($Role.getRef);
        const res = srvUserObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles revoked from [${cmd.revokeRolesFromUser}]`);
      }
    };
    const _deployRevokedUser = () => {
      _loadServerUser();
      if (!srvUserObj) return;
      _deployRevokedRoles();
    };
    const _setPassword = () => {
      const title = `Password`;
      if (passwd) {
        _logger.warn(title, `Password set. If you don't want to override, press Enter only.`);
      }
      const input = passwordPrompt();
      if (!input) {
        _logger.warn(title, `Empty password. Password unchanged.`);
        return;
      }
      passwd = input;
      _logger.info(title, `Password updated.`);
    };
    const _deploy = () => {
      const title = `CreateUser`;
      _loadServerUser();
      if (!srvUserObj) {
        if (!passwd) {
          _setPassword();
        }
        const cmd = {
          createUser: userObj.user,
          pwd       : passwd,
          roles     : userObj.roles.map($Role.getRef).filter($Check.isNotNull),
          writeConcern: {w: `majority`},
        };
        const res = userObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `[${cmd.createUser}] user created`);
      }
      _deployGrantedUser();
      _deployRevokedUser();
    };
    const _drop = (confirm) => {
      const title = `DropUser`;
      if (userObj.user != confirm) {
        _logger.err(title, `Please confirm that you want to drop [${userObj.user}] user`)
        return;
      }
      _loadServerUser();
      if (srvUserObj == null) {
        _logger.warn(title, `Cannot confirm user's status on server. Aborting...`);
        return;
      }
      const cmd = {
        dropUser: userObj.user,
        writeConcern: {w: `majority`},
      };
      const res = userObj.db.runCommand(cmd);
      if (!res.ok) {
        _logger.err(title, res.errmsg);
        return;
      }
      _logger.info(title, `[${cmd.dropUser}] user dropped`);
    };
    const _addRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      if ($Object.filterNotEqualUsingValueOf.bind({arr: userObj.roles})(_role)) {
        userObj.roles.push(_role);
        _logger(`AddRole`, `${_role} added.`);
      };
    };
    const _removeRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      const idx = userObj.roles.map($Object.valueOf).indexOf(_role.valueOf());
      if (idx > 0) {
        userObj.roles.splice(idx, 1);
        _logger(`RemoveRole`, `${_role} removed.`);
      }
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString          : Object.extend({value: function (...p) { return _toString          (...p) }}, _descriptor),
      tojson            : Object.extend({value: function (...p) { return _toString          (...p) }}, _descriptor),
      valueOf           : Object.extend({value: function (...p) { return _valueOf           (...p) }}, _descriptor),
      getRaw            : Object.extend({value: function (...p) { return _getRaw            (...p) }}, _descriptor),
      getRef            : Object.extend({value: function (...p) { return _getRef            (...p) }}, _descriptor),
      getDef            : Object.extend({value: function (...p) { return _getDef            (...p) }}, _descriptor),
      getSrv            : Object.extend({value: function (...p) { return _getSrv            (...p) }}, _descriptor),
      syncUser          : Object.extend({value: function (...p) { return _syncUser          (...p) }}, _descriptor),
      deployGrantedUser : Object.extend({value: function (...p) { return _deployGrantedUser (...p) }}, _descriptor),
      deployRevokedUser : Object.extend({value: function (...p) { return _deployRevokedUser (...p) }}, _descriptor),
      deploy            : Object.extend({value: function (...p) { return _deploy            (...p) }}, _descriptor),
      drop              : Object.extend({value: function (...p) { return _drop              (...p) }}, _descriptor),
      addRole           : Object.extend({value: function (...p) { return _addRole           (...p) }}, _descriptor),
      removeRole        : Object.extend({value: function (...p) { return _removeRole        (...p) }}, _descriptor),
    });

    _genData();
    if (!userObj) return null;
    if (userObj.roles.length == 0) {
      _syncUser();
    } else {
      _loadServerUser();
    }
    $Object.deepFreeze(this);
    return this;
  };
  const __$User__ = $User.prototype = {
    help: function () {
      return `\
[$User](db, user, roles) - User object helper
  .getRaw() - Return raw user object
  .getRef() - Return the user object used for reference
  .getDef() - Return the user object used for definition
  .getSrv() - Return server's user object
  .syncUser() - Update local user object to match with server's one
  .deployGrantedUser() - Deploy granted changes in user object to server
  .deployRevokedUser() - Deploy revoked changes in user object to server
  .deploy() - Deploy all changes in user object to server
  .drop(confirm) - Drop user from server
  .addRole(role) - Grant role to this user
  .removeRole(role) - Revoke role from this user
`;
    },
  };
  const $UserExt = {
    getRef: (obj) => {
      if ($User.is$User(obj)) {
        return obj.getRef();
      }
      return null;
    },
    getDef: (obj) => {
      if ($User.is$User(obj)) {
        return obj.getDef();
      }
      return null;
    },
    is$User: (obj) => {
      return $Schema({'!data': $User}).test({data: obj});
    },
  };

  /** Define deploy object */
  const _id = `$User`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $User = Object.extend(${tojson($User)}, ${tojson($UserExt)});
  $User.prototype = ${tojson(__$User__)};
  $User.toString = $User.tojson = function () {return this.prototype.help()};
  $User.prototype.toString = $User.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($User);
  return $User;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}