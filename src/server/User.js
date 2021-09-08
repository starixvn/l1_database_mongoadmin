{
  const $User = function (db, user, roles) {
    /** Self construct */
    if (!(this instanceof $User)) return new $User(...arguments);

    /** Private constant */
    const _logger = $Log(`USER`);

    const userSchema = $Schema({
      '!db'   : "Database",
      '!user' : "string",
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
        roles     : [roles].flat().filter(Boolean).map($Role).sort(),
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
        roles : userObj.roles.map($Role.getRef).filter(Boolean),
      };
    };
    const _mapUserDB = (obj) => {
      obj.db = userObj.db.getSiblingDB(obj.db);
      return obj;
    }
    const _loadServerUser = async () => {
      const title = `ServerUser`;
      if (userObj == null) return;
      const cmd = {
        usersInfo: userObj.user,
      };
      const res = await userObj.db.runCommand(cmd);
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
    const _getSrv = async () => {
      await _loadServerUser();
      return srvUserObj;
    };
    const _syncUser = async () => {
      const title = `Sync`;
      await _loadServerUser();
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
    const _deployGrantedRoles = async () => {
      const title = `GrantRoles`;
      const cmd = {
        grantRolesToUser: srvUserObj.user,
        writeConcern: {w: `majority`},
      };
      const granting = userObj.roles.filter(_ => !srvUserObj.roles.map(Object.valueOf).includes(_.valueOf()));
      if (granting.length > 0) {
        cmd.roles = granting.map($Role.getRef);
        const res = await srvUserObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles granted to [${cmd.grantRolesToUser}]`);
        granting.forEach(_ => _logger.info(title, `  ${_}`));
      }
    };
    const _deployGrantedUser = async () => {
      await _loadServerUser();
      if (!srvUserObj) return;
      return _deployGrantedRoles();
    };
    const _deployRevokedRoles = async () => {
      const title = `RevokeRoles`;
      const cmd = {
        revokeRolesFromUser: srvUserObj.user,
        writeConcern: {w: `majority`},
      };
      const revoking = srvUserObj.roles.filter(_ => !userObj.roles.map(Object.valueOf).includes(_.valueOf()));
      if (revoking.length > 0) {
        cmd.roles = revoking.map($Role.getRef);
        const res = await srvUserObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles revoked from [${cmd.revokeRolesFromUser}]`);
        revoking.forEach(_ => _logger.info(title, `  ${_}`));
      }
    };
    const _deployRevokedUser = async () => {
      await _loadServerUser();
      if (!srvUserObj) return;
      return _deployRevokedRoles();
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
    const _deploy = async () => {
      const title = `CreateUser`;
      await _loadServerUser();
      if (!srvUserObj) {
        if (!passwd) {
          _setPassword();
        }
        const cmd = {
          createUser: userObj.user,
          pwd       : passwd,
          roles     : userObj.roles.map($Role.getRef).filter(Boolean),
          writeConcern: {w: `majority`},
        };
        const res = await userObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `[${cmd.createUser}] user created`);
      }
      const tasks = [_deployGrantedUser(), _deployRevokedUser()];
      await Promise.allSettled(tasks);
    };
    const _drop = async (confirm) => {
      const title = `DropUser`;
      if (userObj.user != confirm) {
        _logger.err(title, `Please confirm that you want to drop [${userObj.user}] user`)
        return;
      }
      await _loadServerUser();
      if (srvUserObj == null) {
        _logger.warn(title, `Cannot confirm user's status on server. Aborting...`);
        return;
      }
      const cmd = {
        dropUser: userObj.user,
        writeConcern: {w: `majority`},
      };
      const res = await userObj.db.runCommand(cmd);
      if (!res.ok) {
        _logger.err(title, res.errmsg);
        return;
      }
      _logger.info(title, `[${cmd.dropUser}] user dropped`);
    };
    const _addRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      if (userObj.roles.map(Object.valueOf).includes(_role.valueOf())) {
        userObj.roles.push(_role);
        _logger(`AddRole`, `${_role} added.`);
      };
    };
    const _removeRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      const idx = userObj.roles.map(Object.valueOf).indexOf(_role.valueOf());
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
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf   (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw    (...arguments) }}, _descriptor),
      getRef                : Object.assign({value: function () { return _getRef    (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getDef    (...arguments) }}, _descriptor),
      addRole               : Object.assign({value: function () { return _addRole   (...arguments) }}, _descriptor),
      removeRole            : Object.assign({value: function () { return _removeRole(...arguments) }}, _descriptor),
      getSrv                : Object.assign({value: function () { return Object.synthesize(_getSrv            (...arguments)) }}, _descriptor),
      syncUser              : Object.assign({value: function () { return Object.synthesize(_syncUser          (...arguments)) }}, _descriptor),
      deploy                : Object.assign({value: function () { return Object.synthesize(_deploy            (...arguments)) }}, _descriptor),
      drop                  : Object.assign({value: function () { return Object.synthesize(_drop              (...arguments)) }}, _descriptor),
      deployGrantedUser     : Object.assign({value: function () { return Object.synthesize(_deployGrantedUser (...arguments)) }}, _descriptor),
      deployRevokedUser     : Object.assign({value: function () { return Object.synthesize(_deployRevokedUser (...arguments)) }}, _descriptor),
    });

    _genData();
    if (!userObj) return null;
    if (userObj.roles.length == 0) {
      _syncUser();
    } else {
      _loadServerUser();
    }
    Object.deepFreeze(this);
    return this;
  };
  const $UserExt = function () {
    return {
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
  };
  const __$User__ = function () {
    return {
      help: function () {
        return `\
[$User](db, user, roles) - User object helper
  .getRaw()             - Return raw user object
  .getRef()             - Return the user object used for reference
  .getDef()             - Return the user object used for definition
  .getSrv()             - Return server's user object
  .syncUser()           - Update local user object to match with server's one
  .deployGrantedUser()  - Deploy granted changes in user object to server
  .deployRevokedUser()  - Deploy revoked changes in user object to server
  .deploy()             - Deploy all changes in user object to server
  .drop(confirm)        - Drop user from server
  .addRole(role)        - Grant role to this user
  .removeRole(role)     - Revoke role from this user
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$User`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $User = Object.assign(${$User}, (${$UserExt})());
  $User.prototype = (${__$User__})();
  $User.toString = $User[util.inspect.custom] = function () {return this.prototype.help()};
  $User.prototype.toString = $User.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($User);
  global.$User = $User;
}`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
