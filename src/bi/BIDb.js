{
  const $BIDb = function (name, tables) {
    /** Self construct */
    if (!(this instanceof $BIDb)) return new $BIDb(...arguments);

    /** Private constant */
    const logger = $Log(`BI.DB`);
    const dbSchema = $Schema({
      '!name'   : "string",
      'tables'  : $BITbl,
    });

    /** Private variable */
    let dbObj = null;

    /** Basic function */
    const _toString = () => {
      return `[$BIDb] ${dbObj?.name}`;
    };
    const _valueOf = () => {
      return `${dbObj?.name}`;
    };

    /** Private function */
    const _parseDbObject = (obj) => {
      if (!dbSchema.test(obj)) {
        logger.err(`Audit`, `Invalid input data for BI database object`);
        return null;
      }
      return obj;
    };
    const _genData = () => {
      if ($BIDb.is$BIDb(arguments[0])) {
        dbObj = _parseDbObject(name.getRaw());
        return;
      }
      if (dbSchema.test(arguments[0])) {
        dbObj = _parseDbObject(arguments[0]);
        return;
      }
      const data = { name };
      data.tables = [tables].flat(Infinity).map($BITbl);
      dbObj = _parseDbObject(data);
    };
    const _getRaw = () => {
      return dbObj;
    };
    const _getDef = () => {
      const data = {...dbObj};
      data.tables = data.tables.map($BITbl.getDef);
      return data;
    };

    const _descriptor = { writable: false, enumerable: true };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf   (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw    (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getDef    (...arguments) }}, _descriptor),
    });

    _genData();

    Object.deepFreeze(this);
    return this;
  };
  const $BIDbExt = function () {
    return {
      is$BIDb: function () {
        return $Schema($BIDb).test(...arguments);
      },
      getRaw: (obj) => {
        if ($BIDb.is$BIDb(obj)) {
          return obj.getRaw();
        }
        return null;
      },
      getDef: (obj) => {
        if ($BIDb.is$BIDb(obj)) {
          return obj.getDef();
        }
        return null;
      },
    };
  };
  const __$BIDb__ = function () {
    return {
      help: function () {
        return `\
[$BIDb](name, tables) - Object helper for defining BI database
  .getRaw() - Get the raw BI database object
  .getDef() - Get the definition of BI database object
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$BIDb`;
  const version = `2.0.0`;
  const changelog = {
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $BIDb = Object.assign(${$BIDb}, (${$BIDbExt})());
  $BIDb.prototype = (${__$BIDb__})();
  $BIDb.toString = $BIDb[util.inspect.custom] = function () {return this.prototype.help()};
  $BIDb.prototype.toString = $BIDb.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($BIDb);
  global.$BIDb = $BIDb;
}`);

  /** Deploy */
  $Deploy(`BI`).run(_id, version, changelog, value);
}
