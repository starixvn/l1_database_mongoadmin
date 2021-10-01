{
  const $Privilege = function (resource, ...actions) {
    /** Self construct */
    if (!(this instanceof $Privilege)) return new $Privilege(...arguments);

    /** Private constant */
    const _logger = $Log(`PRIVILEGE`);

    const privSchema = $Schema({
      '!resource': [
        { '!db'             : "string",
          '!collection'     : "string",
        },
        { '!anyResource'    : "boolean",
        },
        { '!cluster'        : "boolean",
        },
        { '!system_buckets' : "string",
        },
      ],
      '!actions': "string",
    });

    /** Private variable */
    let privObj = null;

    /** Basic function */
    const _toString = () => {
      if (!privObj) {
        return `Invalid [$Privilege]`;
      }
      if (!util.isNullOrUndefined(privObj.resource.db) || !util.isNullOrUndefined(privObj.resource.collection)) {
        return `[$Privilege] ${privObj.resource.db || '*'}.${privObj.resource.collection || '*'}`;
      }
      if (!util.isNullOrUndefined(privObj.resource.anyResource)) {
        return `[$Privilege] anyResource`;
      }
      if (!util.isNullOrUndefined(privObj.resource.cluster)) {
        return `[$Privilege] cluster`;
      }
      if (!util.isNullOrUndefined(privObj.resource.system_buckets)) {
        return `[$Privilege] system_buckets`;
      }
      return `[$Privilege]`;
    };
    const _valueOf = () => {
      if (!privObj) {
        return null;
      }
      let resName = ``;
      if (!util.isNullOrUndefined(privObj.resource.db) || !util.isNullOrUndefined(privObj.resource.collection)) {
        resName = `${privObj.resource.db || '*'}.${privObj.resource.collection || '*'}`;
      }
      if (!util.isNullOrUndefined(privObj.resource.anyResource)) {
        resName = `anyResource`;
      }
      if (!util.isNullOrUndefined(privObj.resource.cluster)) {
        resName = `cluster`;
      }
      if (!util.isNullOrUndefined(privObj.resource.system_buckets)) {
        resName = `system_buckets`;
      }
      return `\
${resName}
(${privObj.actions.sort().join(', ')})`;
    };

    /** Private function */
    const _genDataObj = (obj) => {
      if (!privSchema.test(obj)) {
        _logger.err(`Audit`, `Invalid input data for privilege object`);
        return;
      }
      privObj = obj;
    }
    const _genData = () => {
      if ($Privilege.is$Privilege(resource)) {
        return _genDataObj(resource.getDef());
      }
      if (privSchema.test(resource)) {
        return _genDataObj(resource);
      }
      let _resource = resource;
      let _actions = [actions].flat(Infinity);
      switch (resource?.constructor?.name) {
        case "Collection":
          _resource = {
            db        : resource.getDB().getName(),
            collection: resource.getName(),
          };
          break;
        case "Database":
          _resource = {
            db        : resource.getName(),
            collection: '',
          };
          break;
        case "Mongo":
          _resource = {
            db        : '',
            collection: '',
          };
          break;
      };
      if (_resource?.db == '_') {
        _resource.db = '';
      }
      const data = {
        resource: _resource,
        actions : _actions,
      }
      return _genDataObj(data);
    };
    const _getRaw = () => {
      return privObj;
    };
    const _getRef = () => {
      return privObj;
    };
    const _getDef = () => {
      return privObj;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw  (...arguments) }}, _descriptor),
      getRef                : Object.assign({value: function () { return _getRef  (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getDef  (...arguments) }}, _descriptor),
    });

    _genData();
    Object.deepFreeze(this);
    return this;
  };
  const $PrivilegeExt = function () {
    return {
      actions: {
        monitor : [`collStats`, `indexStats`],
        read    : [`find`, `listIndexes`],
        list    : [`listCollections`],
      },
      getRef: (obj) => {
        if ($Privilege.is$Privilege(obj)) {
          return obj.getRef();
        }
        return null;
      },
      getDef: (obj) => {
        if ($Privilege.is$Privilege(obj)) {
          return obj.getDef();
        }
        return null;
      },
      is$Privilege: function () {
        return $Schema($Privilege).test(...arguments);
      },
    };
  };
  const __$Privilege__ = function () {
    return {
      help: function () {
        return `\
[$Privilege](resource, ...actions) - Privilege object helper
  .getRaw() - Return raw privilege object
  .getRef() - Return the privilege object used for reference
  .getDef() - Return the privilege object used for definition
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Privilege`;
  const version = `0.2.1`;
  const changelog = {
    '0.2.1': [
      `[${_id}] Remove usage of internal field, using supported methods instead`,
    ],
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Privilege = Object.assign(${$Privilege}, (${$PrivilegeExt})());
  $Privilege.prototype = (${__$Privilege__})();
  $Privilege.toString = $Privilege[util.inspect.custom] = function () { return this.prototype.help() };
  $Privilege.prototype.toString = $Privilege.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Privilege);
  global.$Privilege = $Privilege;
}`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
