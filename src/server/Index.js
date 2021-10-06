{
  const $Index = function (key, opts) {
    /** Self construct */
    if (!(this instanceof $Index)) return new $Index(...arguments);

    /** Private constant */
    const _logger = $Log(`INDEX`);

    const indexSchema = $Schema({
      '!key'                    : "object",
      'name'                    : "string",
      'unique'                  : "boolean",
      'partialFilterExpression' : "object",
      'sparse'                  : "boolean",
      'expireAfterSeconds'      : "number",
      'collation'               : [
        $Collation,
        {
          '!locale'         : "string",
          'caseLevel'       : "boolean",
          'caseFirst'       : "string",
          'strength'        : "number",
          'numericOrdering' : "boolean",
          'alternate'       : "string",
          'maxVariable'     : "string",
          'normalization'   : "boolean",
          'backwards'       : "boolean",
        },
      ],
    });

    /** Private variable */
    let idxObj = {};

    /** Basic function */
    const _toString = () => {
      return `[$Index] ${_generateIndexName()}`;
    };
    const _valueOf = () => {
      const def = _getDef();
      delete def.name;
      if ($Collation(def.collation).valueOf() == $Collation().valueOf()) {
        delete def.collation;
      }
      return util.inspect(Object.sort(def));
    };

    /** Private function */
    const _parseIndexObject = (obj) => {
      const title = ` Audit  `;

      if (obj.hasOwnProperty(`collation`)) {
        obj.collation = $Collation(obj.collation);
      }

      if (!indexSchema.test(obj)) {
        _logger.err(title, `Index object is invalid`);
        _logger.err(title, `  ${util.inspect(obj)}`);
        return null;
      }

      /** Remove unused fields */
      delete obj.v;
      delete obj.ns;

      return Object.sort(obj);
    };
    const _genData = () => {
      if ($Index.is$Index(key)) {
        idxObj = _parseIndexObject(key.getRaw());
        return;
      }
      if (indexSchema.test(key)) {
        idxObj = _parseIndexObject(key);
        return;
      }
      const data = Object.assign({key: key}, opts);
      idxObj = _parseIndexObject(data);
    };
    const _getRaw = () => {
      return idxObj;
    };
    const _generateKeysName = (key) => {
      return Object.keys(key).map(_ => [_, key[_] != 1 ? key[_] : null].filter(Boolean).join('$')).join('_');
    };
    const _generateIndexName = (coll) => {
      if (util.inspect(idxObj.key) == util.inspect({_id: 1})) {
        return `_id_`;
      }

      let name = `IX`;
      const collName = coll?.constructor?.name == "Collection" ? coll.getName() : null;
      if (idxObj.unique) {
        name = `U${name}`;
      }
      if (idxObj.partialFilterExpression) {
        name = `F${name}`;
      }
      name = [name, collName, _generateKeysName(idxObj.key)].filter(Boolean).join(`_`);
      if (idxObj.expireAfterSeconds) {
        name =  [`TTL`, name].filter(Boolean).join(`_`);
      }
      if (idxObj.collation) {
        const collate = idxObj.collation.getSimple();
        name = [name, collate.locale, collate.strength].filter(Boolean).join(`_`);
      }

      return name;
    };
    const _getDef = (coll) => {
      const data = Object.assign({}, idxObj);
      if (coll?.constructor?.name == "Collection") {
        data.name = _generateIndexName(coll);
      }
      if (data.collation) {
        data.collation = data.collation.getSimple();
      }
      return data;
    };
    const _getKey = () => {
      return idxObj.key;
    };
    const _create = (coll) => {
      const title = ` Create `;
      if (coll?.constructor?.name != "Collection") {
        _logger.err(title, `Invalid collection ${util.inspect(coll)}`);
        return;
      }
      const idx = _getDef(coll);
      const cmd = {
        createIndexes : coll.getName(),
        indexes       : [idx],
      };
      try {
        const res = coll.runCommand(cmd);
        if (res.createdCollectionAutomatically) {
          _logger.warn(title, `Collection [${coll.getName()}] does NOT exist. Created.`);
        }
        if (res.numIndexesAfter - res.numIndexesBefore) {
          _logger.info(title, `Index [${coll.getName()}].[${idx.name}] created.`);
        }
        if (!res.ok) {
          _logger.err(title, res);
        }
      }
      catch (e) {
        _logger.err(title, `[${e.code}-${e.name}] · ${e.errmsg}`);
      }
    };
    const _drop = (coll) => {
      const title = `  Drop  `;
      if (util.inspect(idxObj.key) == util.inspect({_id: 1})) return;
      if (coll?.constructor?.name != "Collection") {
        _logger.err(title, `Invalid collection ${util.inspect(coll)}`);
        return;
      }
      const idx = idxObj.name ?? idxObj.key;
      const cmd = {
        dropIndexes : coll.getName(),
        index       : idx,
      };
      try {
        const res = coll.runCommand(cmd);
        if (res.ok) {
          _logger.info(title, `Index [${coll.getName()}].[${util.inspect(idx)}] dropped.`);
        }
        if (!res.ok) {
          _logger.err(title, res);
        }
      } catch (e) {
        _logger.err(title, `[${e.code}-${e.name}] · ${e.errmsg}`);
      }
    };
    const _recreate = (coll) => {
      _drop(coll);
      _create(coll);
    };
    const _setDefaultCollation = (collate) => {
      if (!idxObj.collation) {
        idxObj.collation = collate;
        idxObj = _parseIndexObject(idxObj);
      }
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString            (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString            (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf             (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw              (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getDef              (...arguments) }}, _descriptor),
      getKey                : Object.assign({value: function () { return _getKey              (...arguments) }}, _descriptor),
      create                : Object.assign({value: function () { return _create              (...arguments) }}, _descriptor),
      drop                  : Object.assign({value: function () { return _drop                (...arguments) }}, _descriptor),
      recreate              : Object.assign({value: function () { return _recreate            (...arguments) }}, _descriptor),
      setDefaultCollation   : Object.assign({value: function () { return _setDefaultCollation (...arguments) }}, _descriptor),
    });

    _genData();
    if (!idxObj) return null;
    Object.deepFreeze(this);
    return this;
  };
  const $IndexExt = function () {
    return {
      getDef: (obj) => {
        if ($Index.is$Index(obj)) {
          return obj.getDef();
        }
        return null;
      },
      getRaw: (obj) => {
        if ($Index.is$Index(obj)) {
          return obj.getRaw();
        }
        return null;
      },
      is$Index: function () {
        return $Schema($Index).test(...arguments);
      },
    };
  };
  const __$Index__ = function () {
    return {
      help: function () {
        return `\
[$Index](key, opts) - Index object helper
  .getRaw()                     - Return raw index object
  .getDef()                     - Return the index object used for definition
  .getKey()                     - Return the index key
  .create(coll)                 - Create index on collection
  .drop(coll)                   - Drop index from collection
  .recreate(coll)               - Drop then create index on collection
  .setDefaultCollation(collate) - Set index collate if not exist
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Index`;
  const version = `0.2.1`;
  const changelog = {
    '0.2.1': [
      `[${_id}] Remove usage of internal field, using supported methods instead`,
      `[${_id}] Remove default collation, let server decide`,
      `[${_id}] Don't include simple collation in valueOf() result`,
      `[${_id}] Include index key value in name if not 1`,
      `[${_id}] New method setDefaultCollation()`,
      `[${_id}] drop() will prefer using name over key`,
    ],
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Index = Object.assign(${$Index}, (${$IndexExt})());
  $Index.prototype = (${__$Index__})();
  $Index.toString = $Index[util.inspect.custom] = function () {return this.prototype.help()};
  $Index.prototype.toString = $Index.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Index);
  global.$Index = $Index;
}`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
