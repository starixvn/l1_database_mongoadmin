{
  const $BISch = function () {
    /** Self construct */
    if (!(this instanceof $BISch)) return new $BISch(...arguments);

    /** Private constant */
    const logger = $Log(`BI.SCH`);
    const schSchema = $Schema({
      '!databases'  : $BIDb,
    });

    /** Private variable */
    let schObj = null;

    /** Basic function */
    const _toString = () => {
      return `[$BISch] ${(schObj?.databases ?? []).map($BIDb.getDef).map(_ => _.name).join(`, `)}`;
    };

    /** Private function */
    const _parseSchObject = (obj) => {
      if (!schSchema.test(obj)) {
        logger.err(`Audit`, `Invalid input data for BI schema object`);
        return null;
      }
      return obj;
    };
    const _genData = () => {
      if ($BISch.is$BISch(arguments[0])) {
        schObj = _parseSchObject(arguments[0].getRaw());
        return;
      }
      if (schSchema.test(arguments[0])) {
        schObj = _parseSchObject(arguments[0]);
        return;
      }
      const data = {};
      data.databases = [...arguments].flat(Infinity).filter(Boolean).map($BIDb).filter(_ => !!_.getRaw());
      schObj = _parseSchObject(data);
    };
    const _getRaw = () => {
      return schObj;
    };
    const _getDef = () => {
      const data = {...schObj};
      data.databases = data.databases.map($BIDb.getDef);
      return data;
    };

    const _descriptor = { writable: false, enumerable: true };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw    (...arguments) }}, _descriptor),
      getDef                : Object.assign({value: function () { return _getDef    (...arguments) }}, _descriptor),
    });

    _genData();

    Object.deepFreeze(this);
    return this;
  };
  const $BISchExt = function () {
    return {
      is$BISch: function () {
        return $Schema($BISch).test(...arguments);
      },
      getRaw: (obj) => {
        if ($BISch.is$BISch(obj)) {
          return obj.getRaw();
        }
        return null;
      },
      getDef: (obj) => {
        if ($BISch.is$BISch(obj)) {
          return obj.getDef();
        }
        return null;
      },
    };
  };
  const __$BISch__ = function () {
    return {
      help: function () {
        return `\
[$BISch](_id, created, version, databases) - Object helper for defining BI schema
  .getRaw() - Get the raw BI schema object
  .getDef() - Get the definition of BI schema object
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$BISch`;
  const version = `2.0.0`;
  const changelog = {
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $BISch = Object.assign(${$BISch}, (${$BISchExt})());
  $BISch.prototype = (${__$BISch__})();
  $BISch.toString = $BISch[util.inspect.custom] = function () {return this.prototype.help()};
  $BISch.prototype.toString = $BISch.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($BISch);
  global.$BISch = $BISch;
}`);

  /** Deploy */
  $Deploy(`BI`).run(_id, version, changelog, value);
}
