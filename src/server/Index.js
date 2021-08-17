{
  const $Index = function (coll) {
    /** Self construct */
    if (!(this instanceof $Index)) return new $Index(coll);

    /** Private constant */
    const _logger = $Log(`INDEX`);
    const _assert = $Assert();
    _assert.setLogger(_logger);

    const indexSchema = $Schema({
      '!key': "object",
      'name': "string",
      'unique': "boolean",
      'partialFilterExpression': "object",
      'sparse': "boolean",
      'expireAfterSeconds': "number",
      'collation': {
        '!locale': "string",
        'strength': "number",
      },
    });

    /** Private variable */
    let _srvIdxs = {};
    let _usrIdxs = {};

    _assert.setTitle(`Audit`);
    _assert.try(
      `[coll] must be a Mongo collection.`,
      coll instanceof DBCollection,
    );
    if (_assert.hasError()) return null;

    /** Basic function */
    const _toString = () => {
      return `[$Index] - Indexes management for collection [${coll}]`;
    };

    /** Private function */
    const _cookCollation = (collation) => {
      return $Collation().load(collation).getSimple();
    };
    const _parseIndexObject = (obj) => {
      const title = ` Audit  `;
      if (!indexSchema.test(obj)) {
        _logger.err(title, `[${coll._shortName}] • [${tojsononeline(obj)}]`);
        _logger.err(title, `Index object is invalid`);
        return null;
      }

      /** Remove unused fields */
      delete obj.v;
      delete obj.ns;

      /** Handle default fields */
      obj.collation = _cookCollation(obj.collation);

      return $Object.sortProperties(obj);
    };
    const _reduceIndexObject = function (accumulator, currentValue) {
      if (currentValue && currentValue.name) {
        accumulator[currentValue.name] = currentValue;
        delete currentValue.name;
      }
      return accumulator;
    };
    const _loadServerIdxs = () => {
      _srvIdxs = coll.getIndexes().map(_parseIndexObject).reduce(_reduceIndexObject, {});
      $Object.deepFreeze(_srvIdxs);
    };
    const _getServerIdxs = () => {
      _loadServerIdxs();
      return _srvIdxs;
    };
    const _getCollection = () => {
      return coll;
    };
    const _generateIndexName = (obj) => {
      let name = `IX`;
      name = obj.unique ? `U${name}` : name;
      name = obj.partialFilterExpression ? `F${name}` : name;
      name = `${name}_${coll._shortName}_${Object.keys(obj.key).join('_')}`;
      name = obj.expireAfterSeconds ? `TTL_${coll._shortName}` : name;
      name = (!!obj.collation) * (obj.collation.locale != "simple") > 0 ? `${name}_${obj.collation.locale}` : name;

      return name;
    };
    const _handleDropIndexesResult = (res) => {
      const title = `  Drop  `;
      if (res.ok) {
        _logger.info(title, `[${coll._shortName}] • » Indexes dropped`);
      }
      if (!res.ok) {
        _logger.err(title, `[${coll._shortName}] • » (${res.codeName}) ${res.errmsg}`);
      }
    };
    const _handleCreateIndexResult = (idxName, res) => {
      const title = ` Create `;
      if (res.ok * (res.numIndexesAfter > res.numIndexesBefore) > 0) {
        _logger.info(title, `[${coll._shortName}] • » Index created`);
      }
      if (res.ok * (res.numIndexesAfter == res.numIndexesBefore) > 0) {
        _logger.info(title, `[${coll._shortName}] • » Index NOT created because ${res.note}`);
      }
      if (!res.ok) {
        _logger.err(title, `[${coll._shortName}] • » (${res.codeName}) ${res.errmsg}`);
      }
    };
    const _dropIndexes = (...idxNames) => {
      const idxs = $Check.isArray(idxNames[0]) ? idxNames[0] : idxNames;
      if (idxs.length == 0) return;

      _logger.info(`  Drop  `, `[${coll._shortName}] • [${idxs.join('] [')}]`);
      const cmd = {
        dropIndexes: coll._shortName,
        index: idxs,
      };
      _handleDropIndexesResult(coll._db.runCommand(cmd));
      _loadServerIdxs();
    };
    const _createIndex = (idxObj) => {
      const title = ` Create `;
      const _idxObj = _parseIndexObject(idxObj);
      if (!_idxObj) return;
      _idxObj.name = _generateIndexName(_idxObj);
      _logger.info(title, `[${coll._shortName}] • [${_idxObj.name}]`);
      const cmd = {
        createIndexes: coll._shortName,
        indexes: [_idxObj],
      };
      _handleCreateIndexResult(_idxObj.name, coll._db.runCommand(cmd));
      _loadServerIdxs();
    };
    const _reCreateIndex = (idxName) => {
      if (idxName == `_id_`) return;
      if (!_srvIdxs[idxName]) return;

      _dropIndexes(idxName);
      const idx = Object.extend({}, _srvIdxs[idxName]);
      _createIndex(idx);
    };
    const _reIndexes = () => {
      _loadServerIdxs();
      Object.keys(_srvIdxs).forEach(_reCreateIndex);
    };
    const _addUserIndex = (idx) => {
      const _idx = _parseIndexObject(idx);
      if (!_idx) return;
      _usrIdxs[_generateIndexName(_idx)] = _idx;
    };
    const _addUserIndexes = (...idxs) => {
      const idxObjs = $Check.isArray(idxs[0]) ? idxs[0] : idxs;
      idxObjs.forEach(_addUserIndex);
    };
    const _removeUserIndexes = (...idxNames) => {
      const idxs = $Check.isArray(idxNames[0]) ? idxNames[0] : idxNames;
      idxs.forEach(_ => {
        delete _usrIdxs[_];
      });
    };
    const _loadUserIndexesFromServer = () => {
      _loadServerIdxs();
      Object.keys(_srvIdxs).forEach(_ => {
        if (_ != `_id_`) {
          _addUserIndex(_srvIdxs[_]);
        }
      });
    };
    const _getUserIndexes = () => {
      return _usrIdxs;
    };
    const _filterNotExistIndex = function (idxName) {
      if (idxName == `_id_`) return false;
      return this.list.indexOf(idxName) < 0;
    };
    const _replaceIndexes = () => {
      const title = `Replace `;
      if (Object.keys(_usrIdxs).length == 0) {
        _logger.warn(title, `Must define indexes before doing replacement`);
        return;
      }
      const srvIdxNames = Object.keys(_srvIdxs);
      const usrIdxNames = Object.keys(_usrIdxs);

      const toBeDeleted = srvIdxNames.filter(_filterNotExistIndex, {list: usrIdxNames});
      const toBeInserted = usrIdxNames.filter(_filterNotExistIndex, {list: srvIdxNames});

      _dropIndexes(toBeDeleted);
      toBeInserted.forEach(_ => _createIndex(_usrIdxs[_]));

      _loadServerIdxs();
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString                  : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson                    : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      loadServerIdxs            : Object.extend({value: function (...p) { return _loadServerIdxs(...p) }}, _descriptor),
      getServerIdxs             : Object.extend({value: function (...p) { return _getServerIdxs(...p) }}, _descriptor),
      getCollection             : Object.extend({value: function (...p) { return _getCollection(...p) }}, _descriptor),
      dropIndexes               : Object.extend({value: function (...p) { return _dropIndexes(...p) }}, _descriptor),
      createIndex               : Object.extend({value: function (...p) { return _createIndex(...p) }}, _descriptor),
      reIndexes                 : Object.extend({value: function (...p) { return _reIndexes(...p) }}, _descriptor),
      addUserIndexes            : Object.extend({value: function (...p) { return _addUserIndexes(...p) }}, _descriptor),
      removeUserIndexes         : Object.extend({value: function (...p) { return _removeUserIndexes(...p) }}, _descriptor),
      loadUserIndexesFromServer : Object.extend({value: function (...p) { return _loadUserIndexesFromServer(...p) }}, _descriptor),
      getUserIndexes            : Object.extend({value: function (...p) { return _getUserIndexes(...p) }}, _descriptor),
      replaceIndexes            : Object.extend({value: function (...p) { return _replaceIndexes(...p) }}, _descriptor),
    });

    _loadServerIdxs();
    $Object.deepFreeze(this);
    return this;
  };
  const __$Index__ = $Index.prototype = {
    help: function () {
      return `\
[$Index](coll) Manage indexes for collection
  .loadServerIdxs() - load indexes data from server
  .getServerIdxs() - return indexes of this collection
  .getCollection() - return collection object
  .dropIndexes(...idxNames) - drop list of index names
  .createIndex(idxObj) - create index
  .reIndexes() - drop and recreate all indexes
  .addUserIndexes(...idxs) - define indexes to be deployed
  .removeUserIndexes(...idxNames) - remove indexes from to be deployed list
  .loadUserIndexesFromServer() - copy server index to to be deployed list
  .getUserIndexes() - return list of to be deployed indexes
  .replaceIndexes() - replace server indexes with to be deployed ones
`;
    },
  };

  /** Define deploy object */
  const _id = `$Index`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Index = ${tojson($Index)};
  $Index.prototype = ${tojson(__$Index__)};
  $Index.toString = $Index.tojson = function () {return this.prototype.help()};
  $Index.prototype.toString = $Index.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Index);
  return $Index;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}