{
  const $BICol = function (mongo_name, sql_name, type) {
    /** Self construct */
    if (!(this instanceof $BICol)) return new $BICol(...arguments);

    /** Private constant */
    const logger = $Log(`BI.COL`);
    const colSchema = $Schema({
      '!mongo_name' : "string",
      '!sql_name'   : "string",
      '!mongo_type' : "string",
      '!sql_type'   : "string",
    });

    /** Private variable */
    let colObj = null;

    /** Basic function */
    const _toString = () => {
      return `[$BICol] ${colObj?.mongo_name} (${colObj?.mongo_type})`;
    };
    const _valueOf = () => {
      return `${colObj?.mongo_name} (${colObj?.mongo_type})`;
    };

    /** Private function */
    const _parseColObject = obj => {
      if (!colSchema.test(obj)) {
        logger.err(`Audit`, `Invalid input data for BI column object - ${obj?.mongo_name} - ${obj?.sql_name}`);
        return null;
      }
      return obj;
    };
    const _genData = () => {
      if ($BICol.is$BICol(arguments[0])) {
        colObj = _parseColObject(arguments[0].getRaw());
        return;
      }
      if (colSchema.test(arguments[0])) {
        colObj = _parseColObject(arguments[0]);
        return;
      }
      const data = { mongo_name, sql_name, ...$BICol.type[type] };
      colObj = _parseColObject(data);
    };
    const _getRaw = () => {
      return colObj;
    };

    const _descriptor = { writable: false, enumerable: true };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf   (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw    (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getRaw    (...arguments) }}, _descriptor),
    });

    _genData();

    Object.deepFreeze(this);
    return this;
  };
  const $BIColExt = function () {
    return {
      type: {
        oid   : { mongo_type: `bson.ObjectId` , sql_type: `objectid`  },
        str   : { mongo_type: `string`        , sql_type: `varchar`   },
        float : { mongo_type: `float64`       , sql_type: `float`     },
        int   : { mongo_type: `int`           , sql_type: `int`       },
        int64 : { mongo_type: `int64`         , sql_type: `int`       },
        bool  : { mongo_type: `bool`          , sql_type: `boolean`   },
        date  : { mongo_type: `date`          , sql_type: `timestamp` },
        filter: { mongo_type: `mongo.Filter`  , sql_type: `varchar`   },
        object: { mongo_type: `bson.Object`   , sql_type: `varchar`   },
        array : { mongo_type: `bson.Array`    , sql_type: `varchar`   },
      },
      is$BICol: function () {
        return $Schema($BICol).test(...arguments);
      },
      getRaw: (obj) => {
        if ($BICol.is$BICol(obj)) {
          return obj.getRaw();
        }
        return null;
      },
      getDef: (obj) => {
        if ($BICol.is$BICol(obj)) {
          return obj.getDef();
        }
        return null;
      },
    };
  };
  const __$BICol__ = function () {
    return {
      help: function () {
        return `\
[$BICol](mongo_name, sql_name, type) - Object helper for defining BI column
  [type] = (${Object.keys($BICol.type).join(', ')})
  .getRaw() - Get the raw BI column object
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$BICol`;
  const version = `2.0.0`;
  const changelog = {
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $BICol = Object.assign(${$BICol}, (${$BIColExt})());
  $BICol.prototype = (${__$BICol__})();
  $BICol.toString = $BICol[util.inspect.custom] = function () {return this.prototype.help()};
  $BICol.prototype.toString = $BICol.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($BICol);
  global.$BICol = $BICol;
}`);

  /** Deploy */
  $Deploy(`BI`).run(_id, version, changelog, value);
}
