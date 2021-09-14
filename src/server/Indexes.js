{
  const $Indexes = function (coll, idxs) {
    /** Self construct */
    if (!(this instanceof $Indexes)) return new $Indexes(...arguments);

    /** Private constant */
    const _logger = $Log(`INDEXES`);

    const idxsSchema = $Schema({
      '!coll' : "Collection",
      '!idxs' : $Index,
    });

    /** Private variable */
    let idxsObj = null;
    let srvIdxsObj = null;

    /** Basic function */
    const _toString = () => {
      if (!idxsObj) {
        return `Invalid [$Indexes]`;
      }
      return `[$Indexes] ${idxsObj.coll._database._name}.${idxsObj.coll._name}`;
    };
    const _valueOf = () => {
      if (!srvIdxsObj) {
        return null;
      }
      return `\
${srvIdxsObj.coll._database._name}.${srvIdxsObj.coll._name}
(${srvIdxsObj.idxs.map(Object.valueOf).sort().join(', ')})`;
    };

    /** Private function */
    const _parseIndexesObj = (obj) => {
      if (!obj.idxs) {
        obj.idxs = [];
      }
      if (!idxsSchema.test(obj)) {
        _logger.err(` Audit  `, `Invalid input data for indexes object`);
        return null;
      }
      return obj;
    };
    const _genData = () => {
      if ($Indexes.is$Indexes(coll)) {
        idxsObj = _parseIndexesObj(coll.getRaw());
        return;
      }
      if (idxsSchema.test(coll)) {
        idxsObj = _parseIndexesObj(coll);
        return;
      }
      const data = {
        coll      : coll,
        idxs      : [idxs].flat(Infinity).filter(Boolean).map($Index).sort(),
      };
      idxsObj = _parseIndexesObj(data);
    };
    const _getRaw = () => {
      return idxsObj;
    };
    const _getSrv = () => {
      return srvIdxsObj;
    };
    const _loadServerIndexes = () => {
      const title = `SrvIdxs `;
      if (!idxsObj) return;
      let srvIdxs = [];
      try {
        srvIdxs = idxsObj.coll.getIndexes().map($Index);
      } catch (e) {
        _logger.err(title, `[${e.code}-${e.codeName}] · ${e.errmsg}`);
      }
      const data = {
        coll: coll,
        idxs: srvIdxs,
      };
      srvIdxsObj = _parseIndexesObj(data);
    };
    const _syncIndexes = () => {
      const title = `  Sync  `;
      _loadServerIndexes();
      if (!srvIdxsObj) {
        _logger.warn(title, `Error loading server indexes list. Local indexes list is not synced.`);
        return;
      }
      if (idxsObj == srvIdxsObj) {
        _logger.info(title, `Local indexes list has already matched with server.`);
        return;
      }
      idxsObj = srvIdxsObj;
    };
    const _create = () => {
      const title = ` Create `;
      _loadServerIndexes();
      const creating = idxsObj.idxs.filter(_ => !srvIdxsObj.idxs.map(Object.valueOf).includes(_.valueOf()));
      if (creating.length > 0) {
        _logger.info(title, `Creating ${creating.length} indexes on ${util.inspect(idxsObj.coll)}`);
        creating.forEach(_ => _.create(idxsObj.coll));
      }
      _loadServerIndexes();
    };
    const notDefaultIndex = (idx) => {
      return util.inspect(idx.getKey()) != util.inspect({_id: 1});
    };
    const _drop = () => {
      const title = `  Drop  `;
      _loadServerIndexes();
      const dropping = srvIdxsObj.idxs.filter(notDefaultIndex).filter(_ => !idxsObj.idxs.map(Object.valueOf).includes(_.valueOf()));
      if (dropping.length > 0) {
        _logger.info(title, `Dropping ${dropping.length} indexes from ${util.inspect(idxsObj.coll)}`);
        dropping.forEach(_ => _.drop(idxsObj.coll));
      }
      _loadServerIndexes();
    };
    const _deploy = () => {
      _create();
      _drop();
    };
    const _recreate = () => {
      _loadServerIndexes();
      srvIdxsObj.idxs.filter(notDefaultIndex).forEach(_ => _.recreate(srvIdxsObj.coll));
      _loadServerIndexes();
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString    (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString    (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf     (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw      (...arguments) }}, _descriptor),
      getSrv                : Object.assign({value: function () { return _getSrv      (...arguments) }}, _descriptor),
      syncIndexes           : Object.assign({value: function () { return _syncIndexes (...arguments) }}, _descriptor),
      create                : Object.assign({value: function () { return _create      (...arguments) }}, _descriptor),
      drop                  : Object.assign({value: function () { return _drop        (...arguments) }}, _descriptor),
      deploy                : Object.assign({value: function () { return _deploy      (...arguments) }}, _descriptor),
      recreate              : Object.assign({value: function () { return _recreate    (...arguments) }}, _descriptor),
    });

    _genData();
    if (!idxsObj) return null;
    _loadServerIndexes();

    Object.deepFreeze(this);
    return this;
  };
  const $IndexesExt = function () {
    return {
      getRef: (obj) => {
        if ($Indexes.is$Indexes(obj)) {
          return obj.getRef();
        }
        return null;
      },
      getDef: (obj) => {
        if ($Indexes.is$Indexes(obj)) {
          return obj.getDef();
        }
        return null;
      },
      is$Indexes: (obj) => {
        return $Schema({'!data': $Indexes}).test({data: obj});
      },
    };
  };
  const __$Indexes__ = function () {
    return {
      help: function () {
        return `\
[$Index](coll, idxs) - Collection indexes object helper
  .getRaw()       - Return raw indexes object
  .getSrv()       - Return server indexes object
  .syncIndexes()  - Update local indexes to matched with server indexes
  .create()       - Create new defined indexes on collection
  .drop()         - Drop old undefined indexes from collection
  .deploy()       - Create new defined and drop old undefined indexes on collection
  .recreate()     - Drop then create every server indexes on collection
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Indexes`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Indexes = Object.assign(${$Indexes}, (${$IndexesExt})());
  $Indexes.prototype = (${__$Indexes__})();
  $Indexes.toString = $Indexes[util.inspect.custom] = function () {return this.prototype.help()};
  $Indexes.prototype.toString = $Indexes.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Indexes);
  global.$Indexes = $Indexes;
}`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
