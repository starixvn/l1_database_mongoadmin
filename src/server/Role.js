{
  const $Role = function (db, role, roles, privileges) {
    /** Self construct */
    if (!(this instanceof $Role)) return new $Role(...arguments);

    /** Private constant */
    const _logger = $Log(`ROLE`);

    const roleSchema = $Schema({
      '!db'       : "Database",
      '!role'     : "string",
      'roles'     : $Role,
      'privileges': $Privilege,
      'isBuiltin' : "boolean",
    });

    /** Private variable */
    let roleObj = null;
    let srvRoleObj = null;

    /** Basic function */
    const _toString = () => {
      if (!roleObj) {
        return `Invalid [$Role]`;
      }
      return `[$Role] ${roleObj.db._name}.${roleObj.role}`;
    };
    const _valueOf = () => {
      if (!srvRoleObj) {
        return null;
      }
      return `\
${srvRoleObj.db._name}.${srvRoleObj.role}
(${srvRoleObj.roles.sort().join(', ')})
(${srvRoleObj.privileges.sort().join(', ')})`;
    };

    /** Private function */
    const _parseRoleObj = (obj) => {
      if (!obj.roles) {
        obj.roles = [];
      }
      if (!obj.privileges) {
        obj.privileges = [];
      }
      if (!roleSchema.test(obj)) {
        _logger.err(`Audit`, `Invalid input data for role object`);
        return null;
      }
      return obj;
    };
    const _genData = () => {
      if ($Role.is$Role(db)) {
        roleObj = _parseRoleObj(db.getRaw());
        return;
      }
      if (roleSchema.test(db)) {
        roleObj = _parseRoleObj(db);
        return;
      }
      const data = {
        db        : db,
        role      : role,
        roles     : [roles].flat().filter(Boolean).map($Role).sort(),
        privileges: [privileges].flat().filter(Boolean).map($Privilege).sort(),
      };
      roleObj = _parseRoleObj(data);
    };
    const _getRaw = () => {
      return roleObj;
    };
    const _getRef = () => {
      if (!roleObj) return null;
      return {
        db  : roleObj.db._name,
        role: roleObj.role,
      };
    };
    const _getDef = () => {
      if (!roleObj) return null;
      return {
        role      : roleObj.role,
        roles     : roleObj.roles.map($Role.getRef).filter(Boolean),
        privileges: roleObj.privileges.map($Privilege.getDef).filter(Boolean),
      };
    };
    const _mapRoleDB = (obj) => {
      obj.db = roleObj.db.getSiblingDB(obj.db);
      return obj;
    }
    const _loadServerRole = async () => {
      const title = `ServerRole`;
      if (!roleObj) return;
      const cmd = {
        rolesInfo: _getRef(),
        showPrivileges: true,
      };
      const res = await roleObj.db.runCommand(cmd);
      if (!res.ok) {
        _logger.err(title, res.errmsg);
        srvRoleObj = null;
        return;
      }
      if (res.roles.length == 0) {
        _logger.warn(title, `[${roleObj.role}] role does not exist on server.`);
        srvRoleObj = null;
        return;
      }
      const data = res.roles[0];
      data.db = roleObj.db.getSiblingDB(data.db);
      data.roles = data.roles.map(_mapRoleDB).map($Role);
      data.privileges = data.privileges.map($Privilege);
      delete data.inheritedRoles;
      delete data.inheritedPrivileges;
      srvRoleObj = _parseRoleObj(data);
    };
    const _getSrv = async () => {
      await _loadServerRole();
      return srvRoleObj;
    };
    const _syncRole = async () => {
      const title = `Sync`;
      await _loadServerRole();
      if (!srvRoleObj) {
        _logger.warn(title, `Error loading server role. Local role is not synced.`);
        return;
      }
      if (roleObj == srvRoleObj) {
        _logger.info(title, `Local role has already matched with server.`);
        return;
      }
      roleObj = srvRoleObj;
    };
    const _deployGrantedRoles = async () => {
      const title = `GrantRoles`;
      const cmd = {
        grantRolesToRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const granting = roleObj.roles.filter(_ => !srvRoleObj.roles.map(Object.valueOf).includes(_.valueOf()));
      if (granting.length > 0) {
        cmd.roles = granting.map($Role.getRef).filter(Boolean);
        const res = await srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles granted to [${cmd.grantRolesToRole}]`);
      }
    };
    const _deployGrantedPrivileges = async () => {
      const title = `GrantPrivileges`;
      const cmd = {
        grantPrivilegesToRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const granting = roleObj.privileges.filter(_ => !srvRoleObj.privileges.map(Object.valueOf).includes(_.valueOf()));
      if (granting.length > 0) {
        cmd.privileges = granting.map($Privilege.getDef).filter(Boolean);
        const res = await srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.privileges.length} privileges granted to [${cmd.grantRolesToRole}]`);
      }
    };
    const _deployGrantedRole = async () => {
      await _loadServerRole();
      if (!srvRoleObj || srvRoleObj.isBuiltin) return;
      const tasks = [_deployGrantedRoles(), _deployGrantedPrivileges()];
      await Promise.allSettled(tasks);
    };
    const _deployRevokedRoles = async () => {
      const title = `RevokeRoles`;
      const cmd = {
        revokeRolesFromRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const revoking = srvRoleObj.roles.filter(_ => !roleObj.roles.map(Object.valueOf).includes(_.valueOf()));
      if (revoking.length > 0) {
        cmd.roles = revoking.map($Role.getRef).filter(Boolean);
        const res = await srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles revoked from [${cmd.revokeRolesFromRole}]`);
      }
    };
    const _deployRevokedPrivileges = async () => {
      const title = `RevokePrivileges`;
      const cmd = {
        revokePrivilegesFromRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const revoking = srvRoleObj.privileges.filter(_ => !roleObj.privileges.map(Object.valueOf).includes(_.valueOf()));
      if (revoking.length > 0) {
        cmd.privileges = revoking.map($Privilege.getRef).filter(Boolean);
        const res = await srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.privileges.length} privileges granted to [${cmd.grantRolesToRole}]`);
      }
    };
    const _deployRevokedRole = async () => {
      await _loadServerRole();
      if (!srvRoleObj || srvRoleObj.isBuiltin) return;
      const tasks = [_deployRevokedRoles(), _deployRevokedPrivileges()];
      await Promise.allSettled(tasks);
    };
    const _deploy = async () => {
      const title = `CreateRole`;
      await _loadServerRole();
      if (!srvRoleObj) {
        const cmd = {
          createRole: roleObj.role,
          privileges: roleObj.privileges.map($Privilege.getRef).filter(Boolean),
          roles: roleObj.roles.map($Role.getRef).filter(Boolean),
          writeConcern: {w: `majority`},
        };
        const res = await roleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `[${cmd.createRole}] role created`);
      }
      const tasks = [_deployGrantedRole(), _deployRevokedRole()];
      await Promise.allSettled(tasks);
    };
    const _drop = async (confirm) => {
      const title = `DropRole`;
      if (roleObj.role != confirm) {
        _logger.err(title, `Please confirm that you want to drop [${roleObj.role}] role`)
        return;
      }
      await _loadServerRole();
      if (!srvRoleObj) {
        _logger.warn(title, `Cannot confirm role's status on server. Aborting...`);
        return;
      }
      const cmd = {
        dropRole: roleObj.role,
        writeConcern: {w: `majority`},
      };
      const res = await roleObj.db.runCommand(cmd);
      if (!res.ok) {
        _logger.err(title, res.errmsg);
        return;
      }
      _logger.info(title, `[${cmd.dropRole}] role dropped`);
    };
    const _addRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      if (!roleObj.roles.map(Object.valueOf).includes(_role.valueOf())) {
        roleObj.roles.push(_role);
        _logger(`AddRole`, `${_role} added.`);
      };
    };
    const _removeRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      const idx = roleObj.roles.map(Object.valueOf).indexOf(_role.valueOf());
      if (idx > 0) {
        roleObj.roles.splice(idx, 1);
        _logger(`RemoveRole`, `${_role} removed.`);
      }
    };
    const _addPrivilege = (privilege) => {
      const _privilege = $Privilege(privilege);
      if (!_privilege.valueOf()) return;
      if (!roleObj.privileges.map(Object.valueOf).includes(_privilege.valueOf())) {
        roleObj.privileges.push(_privilege);
        _logger(`AddPrivilege`, `${_privilege} added.`);
      };
    };
    const _removePrivilege = (privilege) => {
      const _privilege = $Privilege(privilege);
      if (!_privilege.valueOf()) return;
      const idx = roleObj.privileges.map(Object.valueOf).indexOf(_privilege.valueOf());
      if (idx > 0) {
        roleObj.privileges.splice(idx, 1);
        _logger(`RemovePrivilege`, `${_privilege} removed.`);
      }
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString          (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString          (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf           (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw            (...arguments) }}, _descriptor),
      getRef                : Object.assign({value: function () { return _getRef            (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getDef            (...arguments) }}, _descriptor),
      addRole               : Object.assign({value: function () { return _addRole           (...arguments) }}, _descriptor),
      removeRole            : Object.assign({value: function () { return _removeRole        (...arguments) }}, _descriptor),
      addPrivilege          : Object.assign({value: function () { return _addPrivilege      (...arguments) }}, _descriptor),
      removePrivilege       : Object.assign({value: function () { return _removePrivilege   (...arguments) }}, _descriptor),
      getSrv                : Object.assign({value: function () { return Object.synthesize(_getSrv            (...arguments)) }}, _descriptor),
      deploy                : Object.assign({value: function () { return Object.synthesize(_deploy            (...arguments)) }}, _descriptor),
      drop                  : Object.assign({value: function () { return Object.synthesize(_drop              (...arguments)) }}, _descriptor),
      syncRole              : Object.assign({value: function () { return Object.synthesize(_syncRole          (...arguments)) }}, _descriptor),
      deployGrantedRole     : Object.assign({value: function () { return Object.synthesize(_deployGrantedRole (...arguments)) }}, _descriptor),
      deployRevokedRole     : Object.assign({value: function () { return Object.synthesize(_deployRevokedRole (...arguments)) }}, _descriptor),
    });

    _genData();
    if (!roleObj) return null;
    if (roleObj.roles.length + roleObj.privileges.length == 0) {
      _syncRole();
    } else {
      _loadServerRole();
    }
    Object.deepFreeze(this);
    return this;
  };
  const $RoleExt = function () {
    return {
      getRef: (obj) => {
        if ($Role.is$Role(obj)) {
          return obj.getRef();
        }
        return null;
      },
      getDef: (obj) => {
        if ($Role.is$Role(obj)) {
          return obj.getDef();
        }
        return null;
      },
      is$Role: (obj) => {
        return $Schema({'!data': $Role}).test({data: obj});
      },
    };
  };
  const __$Role__ = function () {
    return {
      help: function () {
        return `\
[$Role](db, role, roles, privileges) - Role object helper
  .getRaw()                   - Return raw role object
  .getRef()                   - Return the role object used for reference
  .getDef()                   - Return the role object used for definition
  .getSrv()                   - Return server's role object
  .syncRole()                 - Update local role object to match with server's one
  .deployGrantedRole()        - Deploy granted changes in role object to server
  .deployRevokedRole()        - Deploy revoked changes in role object to server
  .deploy()                   - Deploy all changes in role object to server
  .drop(confirm)              - Drop role from server
  .addRole(role)              - Grant role to this role
  .removeRole(role)           - Revoke role from this role
  .addPrivilege(privilege)    - Grant privilege to this role
  .removePrivilege(privilege) - Revoke privilege from this role
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Role`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Role = Object.assign(${$Role}, (${$RoleExt})());
  $Role.prototype = (${__$Role__})();
  $Role.toString = $Role.tojson = function () {return this.prototype.help()};
  $Role.prototype.toString = $Role.prototype.tojson = function () { return this.help(); }

  Object.deepFreeze($Role);
  return $Role;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
