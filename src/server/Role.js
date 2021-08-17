{
  const $Role = function (db, role, roles, privileges) {
    /** Self construct */
    if (!(this instanceof $Role)) return new $Role(db, role, roles, privileges);

    /** Private constant */
    const _logger = $Log(`ROLE`);

    const roleSchema = $Schema({
      '!db'       : DB,
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
        roles     : $Object.toArrayIfNot(roles).filter($Check.isNotNull).map($Role).sort(),
        privileges: $Object.toArrayIfNot(privileges).filter($Check.isNotNull).map($Privilege).sort(),
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
        roles     : roleObj.roles.map($Role.getRef).filter($Check.isNotNull),
        privileges: roleObj.privileges.map($Privilege.getDef).filter($Check.isNotNull),
      };
    };
    const _mapRoleDB = (obj) => {
      obj.db = roleObj.db.getSiblingDB(obj.db);
      return obj;
    }
    const _loadServerRole = () => {
      const title = `ServerRole`;
      if (!roleObj) return;
      const cmd = {
        rolesInfo: _getRef(),
        showPrivileges: true,
      };
      const res = roleObj.db.runCommand(cmd);
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
    const _getSrv = () => {
      _loadServerRole();
      return srvRoleObj;
    };
    const _syncRole = () => {
      const title = `Sync`;
      _loadServerRole();
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
    const _deployGrantedRoles = () => {
      const title = `GrantRoles`;
      const cmd = {
        grantRolesToRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const granting = roleObj.roles.filter($Object.filterNotEqualUsingValueOf, {arr: srvRoleObj.roles});
      if (granting.length > 0) {
        cmd.roles = granting.map($Role.getRef).filter($Check.isNotNull);
        const res = srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles granted to [${cmd.grantRolesToRole}]`);
      }
    };
    const _deployGrantedPrivileges = () => {
      const title = `GrantPrivileges`;
      const cmd = {
        grantPrivilegesToRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const granting = roleObj.privileges.filter($Object.filterNotEqualUsingValueOf, {arr: srvRoleObj.privileges});
      if (granting.length > 0) {
        cmd.privileges = granting.map($Privilege.getDef).filter($Check.isNotNull);
        const res = srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.privileges.length} privileges granted to [${cmd.grantRolesToRole}]`);
      }
    };
    const _deployGrantedRole = () => {
      _loadServerRole();
      if (!srvRoleObj || srvRoleObj.isBuiltin) return;
      _deployGrantedRoles();
      _deployGrantedPrivileges();
    };
    const _deployRevokedRoles = () => {
      const title = `RevokeRoles`;
      const cmd = {
        revokeRolesFromRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const revoking = srvRoleObj.roles.filter($Object.filterNotEqualUsingValueOf, {arr: roleObj.roles});
      if (revoking.length > 0) {
        cmd.roles = revoking.map($Role.getRef).filter($Check.isNotNull);
        const res = srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.roles.length} roles revoked from [${cmd.revokeRolesFromRole}]`);
      }
    };
    const _deployRevokedPrivileges = () => {
      const title = `RevokePrivileges`;
      const cmd = {
        revokePrivilegesFromRole: srvRoleObj.role,
        writeConcern: {w: `majority`},
      };
      const revoking = srvRoleObj.privileges.filter($Object.filterNotEqualUsingValueOf, {arr: roleObj.privileges});
      if (revoking.length > 0) {
        cmd.privileges = revoking.map($Privilege.getRef).filter($Check.isNotNull);
        const res = srvRoleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `${cmd.privileges.length} privileges granted to [${cmd.grantRolesToRole}]`);
      }
    };
    const _deployRevokedRole = () => {
      _loadServerRole();
      if (!srvRoleObj || srvRoleObj.isBuiltin) return;
      _deployRevokedRoles();
      _deployRevokedPrivileges();
    };
    const _deploy = () => {
      const title = `CreateRole`;
      _loadServerRole();
      if (!srvRoleObj) {
        const cmd = {
          createRole: roleObj.role,
          privileges: roleObj.privileges.map($Privilege.getRef).filter($Check.isNotNull),
          roles: roleObj.roles.map($Role.getRef).filter($Check.isNotNull),
          writeConcern: {w: `majority`},
        };
        const res = roleObj.db.runCommand(cmd);
        if (!res.ok) {
          _logger.err(title, res.errmsg);
          return;
        }
        _logger.info(title, `[${cmd.createRole}] role created`);
      }
      _deployGrantedRole();
      _deployRevokedRole();
    };
    const _drop = (confirm) => {
      const title = `DropRole`;
      if (roleObj.role != confirm) {
        _logger.err(title, `Please confirm that you want to drop [${roleObj.role}] role`)
        return;
      }
      _loadServerRole();
      if (!srvRoleObj) {
        _logger.warn(title, `Cannot confirm role's status on server. Aborting...`);
        return;
      }
      const cmd = {
        dropRole: roleObj.role,
        writeConcern: {w: `majority`},
      };
      const res = roleObj.db.runCommand(cmd);
      if (!res.ok) {
        _logger.err(title, res.errmsg);
        return;
      }
      _logger.info(title, `[${cmd.dropRole}] role dropped`);
    };
    const _addRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      if ($Object.filterNotEqualUsingValueOf.bind({arr: roleObj.roles})(_role)) {
        roleObj.roles.push(_role);
        _logger(`AddRole`, `${_role} added.`);
      };
    };
    const _removeRole = (role) => {
      const _role = $Role(role);
      if (!_role.valueOf()) return;
      const idx = roleObj.roles.map($Object.valueOf).indexOf(_role.valueOf());
      if (idx > 0) {
        roleObj.roles.splice(idx, 1);
        _logger(`RemoveRole`, `${_role} removed.`);
      }
    };
    const _addPrivilege = (privilege) => {
      const _privilege = $Privilege(privilege);
      if (!_privilege.valueOf()) return;
      if ($Object.filterNotEqualUsingValueOf.bind({arr: roleObj.privileges})(_privilege)) {
        roleObj.privileges.push(_privilege);
        _logger(`AddPrivilege`, `${_privilege} added.`);
      };
    };
    const _removePrivilege = (privilege) => {
      const _privilege = $Privilege(privilege);
      if (!_privilege.valueOf()) return;
      const idx = roleObj.privileges.map($Object.valueOf).indexOf(_privilege.valueOf());
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
      toString          : Object.extend({value: function (...p) { return _toString          (...p) }}, _descriptor),
      tojson            : Object.extend({value: function (...p) { return _toString          (...p) }}, _descriptor),
      valueOf           : Object.extend({value: function (...p) { return _valueOf           (...p) }}, _descriptor),
      getRaw            : Object.extend({value: function (...p) { return _getRaw            (...p) }}, _descriptor),
      getRef            : Object.extend({value: function (...p) { return _getRef            (...p) }}, _descriptor),
      getDef            : Object.extend({value: function (...p) { return _getDef            (...p) }}, _descriptor),
      getSrv            : Object.extend({value: function (...p) { return _getSrv            (...p) }}, _descriptor),
      syncRole          : Object.extend({value: function (...p) { return _syncRole          (...p) }}, _descriptor),
      deployGrantedRole : Object.extend({value: function (...p) { return _deployGrantedRole (...p) }}, _descriptor),
      deployRevokedRole : Object.extend({value: function (...p) { return _deployRevokedRole (...p) }}, _descriptor),
      deploy            : Object.extend({value: function (...p) { return _deploy            (...p) }}, _descriptor),
      drop              : Object.extend({value: function (...p) { return _drop              (...p) }}, _descriptor),
      addRole           : Object.extend({value: function (...p) { return _addRole           (...p) }}, _descriptor),
      removeRole        : Object.extend({value: function (...p) { return _removeRole        (...p) }}, _descriptor),
      addPrivilege      : Object.extend({value: function (...p) { return _addPrivilege      (...p) }}, _descriptor),
      removePrivilege   : Object.extend({value: function (...p) { return _removePrivilege   (...p) }}, _descriptor),
    });

    _genData();
    if (!roleObj) return null;
    if (roleObj.roles.length + roleObj.privileges.length == 0) {
      _syncRole();
    } else {
      _loadServerRole();
    }
    $Object.deepFreeze(this);
    return this;
  };
  const __$Role__ = $Role.prototype = {
    help: function () {
      return `\
[$Role](db, role, roles, privileges) - Role object helper
  .getRaw() - Return raw role object
  .getRef() - Return the role object used for reference
  .getDef() - Return the role object used for definition
  .getSrv() - Return server's role object
  .syncRole() - Update local role object to match with server's one
  .deployGrantedRole() - Deploy granted changes in role object to server
  .deployRevokedRole() - Deploy revoked changes in role object to server
  .deploy() - Deploy all changes in role object to server
  .drop(confirm) - Drop role from server
  .addRole(role) - Grant role to this role
  .removeRole(role) - Revoke role from this role
  .addPrivilege(privilege) - Grant privilege to this role
  .removePrivilege(privilege) - Revoke privilege from this role
`;
    },
  };
  const $RoleExt = {
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

  /** Define deploy object */
  const _id = `$Role`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Role = Object.extend(${tojson($Role)}, ${tojson($RoleExt)});
  $Role.prototype = ${tojson(__$Role__)};
  $Role.toString = $Role.tojson = function () {return this.prototype.help()};
  $Role.prototype.toString = $Role.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Role);
  return $Role;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}