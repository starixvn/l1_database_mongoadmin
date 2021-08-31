{
  const $Privilege = function (db, collection, ...actions) {
    /** Self construct */
    if (!(this instanceof $Privilege)) return new $Privilege(...arguments);

    /** Private constant */
    const _logger = $Log(`PRIVILEGE`);

    const privSchema = $Schema({
      '!resource': [
        { '!db'         : "string",
          '!collection' : "string",
        },
        { '!anyResource': "boolean",
        },
        { '!cluster'    : "boolean",
        },
      ],
      '!actions': "string",
    });

    /** Private variable */
    let privObj = null;

    /** Basic function */
    const _toString = () => {
      let str = `[$Privilege]`;
      if (!privObj) {
        str = `Invalid [$Privilege]`;
      }
      if (!util.isNullOrUndefined(privObj.resource.db) || !util.isNullOrUndefined(privObj.resource.collection)) {
        str = `[$Privilege] ${privObj.resource.db || '*'}.${privObj.resource.collection || '*'}`;
      }
      if (!util.isNullOrUndefined(privObj.resource.anyResource)) {
        str = `[$Privilege] anyResource`;
      }
      if (!util.isNullOrUndefined(privObj.resource.cluster)) {
        str = `[$Privilege] cluster`;
      }
      return str;
    };
    const _valueOf = () => {
      if (!privObj) {
        return null;
      }
      return `\
${privObj.resource.db}.${privObj.resource.collection || '*'}
(${privObj.actions.sort().join(', ')})`;
    };

    /** Private function */
    const _reduceActions = (accumulator, currentValue) => {
      const data = util.isArray(currentValue) ? currentValue : [currentValue];
      accumulator = [...accumulator, ...data];
      return accumulator;
    };
    const _genDataObj = (obj) => {
      if (!privSchema.test(obj)) {
        _logger.err(`Audit`, `Invalid input data for privilege object`);
        return;
      }
      privObj = obj;
    }
    const _genData = () => {
      if ($Privilege.is$Privilege(db)) {
        return _genDataObj(db.getDef());
      }
      if (privSchema.test(db)) {
        return _genDataObj(db);
      }
      if (collection?.constructor?.name == "Collection") {
        db = collection._db;
        collection = collection._shortName;
      }
      if (db?.constructor?.name == "Database") {
        db = db._name;
      }
      const data = {
        resource: {db, collection},
        actions: actions.reduce(_reduceActions, []),
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
      toString: Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      tojson  : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      valueOf : Object.assign({value: function () { return _valueOf (...arguments) }}, _descriptor),
      getRaw  : Object.assign({value: function () { return _getRaw  (...arguments) }}, _descriptor),
      getRef  : Object.assign({value: function () { return _getRef  (...arguments) }}, _descriptor),
      getDef  : Object.assign({value: function () { return _getDef  (...arguments) }}, _descriptor),
    });

    _genData();
    Object.deepFreeze(this);
    return this;
  };
  const $PrivilegeExt = function () {
    return {
      template: {
        public  : [`find`],
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
      is$Privilege: (obj) => {
        return $Schema({'!data': $Privilege}).test({data: obj});
      },
    };
  };
  const __$Privilege__ = function () {
    return {
      help: function () {
        return `\
[$Privilege](db, collection, ...actions) - Privilege object helper
  .getRaw() - Return raw privilege object
  .getRef() - Return the privilege object used for reference
  .getDef() - Return the privilege object used for definition
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Privilege`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Privilege = Object.assign(${$Privilege}, (${$PrivilegeExt})());
  $Privilege.prototype = (${__$Privilege__})();
  $Privilege.toString = $Privilege.tojson = function () { return this.prototype.help() };
  $Privilege.prototype.toString = $Privilege.prototype.tojson = function () { return this.help(); }

  Object.deepFreeze($Privilege);
  return $Privilege;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
