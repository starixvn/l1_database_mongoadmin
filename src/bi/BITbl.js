{
  const $BITbl = function (mongo_name, sql_name, pipeline, columns) {
    /** Self construct */
    if (!(this instanceof $BITbl)) return new $BITbl(...arguments);
    /** Private constant */

    const logger = $Log(`BI.TBL`);
    const tblSchema = $Schema({
      '!mongo_name' : "string",
      '!sql_name'   : "string",
      '!pipeline'   : "object",
      '!columns'    : $BICol,
    });

    /** Private variable */
    let tblObj = null;

    /** Basic function */
    const _toString = () => {
      return `[$BITbl] ${tblObj?.mongo_name}`;
    };

    const _valueOf = () => {
      return `${tblObj?.mongo_name}`;
    };

    /** Private function */
    const _parseTblObject = (obj) => {
      if (!tblSchema.test(obj)) {
        logger.err(`Audit`, `Invalid input data for BI table object`);
        return null;
      }
      return obj;
    };
    const _parsePipeline = (obj) => {
      let data = obj;
      if ($Schema("string").test(obj)) {
        try {
          data = EJSON.parse(obj);
        } catch (e) {
          logger.err(`Pipeline`, `Error trying to parse pipeline`);
        }
      }
      return [data].flat(Infinity);
    };
    const _genData = () => {
      if ($BITbl.is$BITbl(arguments[0])) {
        tblObj = _parseTblObject(arguments[0].getRaw());
        return;
      }
      if (tblSchema.test(arguments[0])) {
        tblObj = _parseTblObject(arguments[0]);
        return;
      }
      const data = { mongo_name, sql_name };
      data.pipeline = _parsePipeline(pipeline);
      data.columns  = [columns].flat(Infinity).map($BICol);
      tblObj = _parseTblObject(data);
    };
    const _getRaw = () => {
      return tblObj;
    };
    const _getDef = () => {
      const data = {...tblObj};
      data.pipeline = EJSON.stringify(data.pipeline);
      data.columns = data.columns.map($BICol.getDef);
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
    if (!tblObj) return null;

    Object.deepFreeze(this);
    return this;
  };
  const $BITblExt = function () {
    return {
      is$BITbl: function () {
        return $Schema($BITbl).test(...arguments);
      },
      getRaw: (obj) => {
        if ($BITbl.is$BITbl(obj)) {
          return obj.getRaw();
        }
        return null;
      },
      getDef: (obj) => {
        if ($BITbl.is$BITbl(obj)) {
          return obj.getDef();
        }
        return null;
      },
    };
  };
  const __$BITbl__ = function () {
    return {
      help: function () {
        return `\
[$BITbl](mongo_name, sql_name, pipeline, columns) - Object helper for defining BI table
  .getRaw() - Get the raw BI table object
  .getDef() - Get the definition of BI table object
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$BITbl`;
  const version = `2.0.0`;
  const changelog = {
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $BITbl = Object.assign(${$BITbl}, (${$BITblExt})());
  $BITbl.prototype = (${__$BITbl__})();
  $BITbl.toString = $BITbl[util.inspect.custom] = function () {return this.prototype.help()};
  $BITbl.prototype.toString = $BITbl.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($BITbl);
  global.$BITbl = $BITbl;
}`);

  /** Deploy */
  $Deploy(`BI`).run(_id, version, changelog, value);
}
