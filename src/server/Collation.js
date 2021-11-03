{
  const $Collation = function (collation) {
    /** Self construct */
    if (!(this instanceof $Collation)) return new $Collation(...arguments);

    /** Private constant */
    const logger = $Log(`COLL`);
    const collationSchema = $Schema({
      '!locale'         : "string",
      'caseLevel'       : "boolean",
      'caseFirst'       : "string",
      'strength'        : "number",
      'numericOrdering' : "boolean",
      'alternate'       : "string",
      'maxVariable'     : "string",
      'normalization'   : "boolean",
      'backwards'       : "boolean",
    });

    /** Private variable */
    let collationObj = {};

    /** Basic function */
    const _toString = () => {
      return `[$Collation] ${util.inspect(_getSimple())}`;
    };
    const _valueOf = () => {
      return util.inspect(Object.sort(_getSimple()));
    };

    /** Private function */
    const _checkValue = (obj, field) => {
      if (!this[field].includes(obj[field])) {
        obj[field] = this.default[field];
      }
    };
    const _parseCollationObj = (obj) => {
      const _obj = Object.assign({}, this.default, obj);
      Object.keys({...obj}).filter(_ => !Object.keys(this.default).includes(_)).forEach(_ => {
        delete _obj[_];
      })
      if (!collationSchema.test(_obj)) {
        logger.err(`Audit`, `Invalid input data for collation object`);
        return Object.assign({}, this.default);
      }
      _checkValue(_obj, `locale`);
      _checkValue(_obj, `strength`);
      return _obj;
    };
    const _genData = () => {
      if ($Collation.is$Collation(collation)) {
        collationObj = collation.getFull();
        return;
      }
      if (collationSchema.test(collation)) {
        collationObj = _parseCollationObj(collation);
        return;
      }
      collationObj = _parseCollationObj();
    }
    const _getFull = () => {
      return collationObj;
    };
    const _getSimple = () => {
      const result = Object.assign({}, collationObj);
      Object.keys(result).forEach(_ => {
        if (_ == `locale`) return;
        if (result[_] == this.default[_]) {
          delete result[_];
        }
      });
      return result;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf   (...arguments) }}, _descriptor),
      getFull               : Object.assign({value: function () { return _getFull   (...arguments) }}, _descriptor),
      getSimple             : Object.assign({value: function () { return _getSimple (...arguments) }}, _descriptor),
    });

    _genData();
    Object.deepFreeze(this);
    return this;
  };
  const $CollationExt = function () {
    return {
      toSimple: (obj) => {
        if ($Collation.is$Collation(obj)) {
          return obj.toSimple();
        }
        return null;
      },
      is$Collation: function () {
        return $Schema($Collation).test(...arguments);
      },
    };
  };
  const __$Collation__ = function () {
    return {
      help: function () {
        return `\
[$Collation](collation) - Object helper for representing a {collation}
  .getFull()    - return full collation object
  .getSimple()  - return minimal collation object
`;
      },
      locale: [
        `simple`,
        `af`, `sq`, `am`, `ar`, `ar@collation=compat`, `hy`, `as`, `az`, `az@collation=search`, `bn`, `be`,
        `bn@collation=traditional`, `bs`, `bs@collation=search`, `bs_Cyrl`, `bg`, `my`, `ca`, `ca@collation=search`, `chr`,
        `zh`, `zh@collation=big5han`, `zh@collation=gb2312han`, `zh@collation=unihan`, `zh@collation=zhuyin`, `zh_Hant`,
        `hr`, `hr@collation=search`, `cs`, `cs@collation=search`, `da`, `da@collation=search`, `nl`, `dz`,
        `en`, `en_US`, `en_US_POSIX`, `eo`, `et`, `ee`, `fo`, `fil`, `fi`, `fi@collation=search`, `fi@collation=traditional`,
        `fr`, `fr_CA`, `gl`, `gl@collation=search`, `ka`, `de`, `de@collation=search`, `de@collation=eor`,
        `de@collation=phonebook`, `de_AT`, `el`, `gu`, `ha`, `haw`, `he`, `he@collation=search`, `hi`, `hu`, `is`,
        `is@collation=search`, `ig`, `smn`, `smn@collation=search`, `id`, `ga`, `it`, `ja`, `ja@collation=unihan`, `kl`,
        `kl@collation=search`, `kn`, `kn@collation=traditional`, `kk`, `km`, `kok`, `ko`, `ko@collation=search`,
        `ko@collation=searchjl`, `ko@collation=unihan`, `ky`, `lkt`, `lo`, `lv`, `ln`, `ln@collation=phonetic`, `lt`,
        `dsb`, `lb`, `mk`, `ms`, `ml`, `mt`, `mr`, `mn`, `ne`, `se`, `se@collation=search`, `nb`, `nb@collation=search`,
        `nn`, `nn@collation=search`, `or`, `om`, `ps`, `fa`, `fa_AF`, `pl`, `pt`, `pa`, `ro`, `ru`, `sr`, `sr_Latn`,
        `sr_Latn@collation=search`, `si`, `si@collation=dictionary`, `sk`, `sk@collation=search`, `sl`, `es`,
        `es@collation=search`, `es@collation=traditional`, `sw`, `sv`, `sv@collation=search`, `ta`, `te`, `th`, `bo`,
        `to`, `tr`, `tr@collation=search`, `uk`, `hsb`, `ur`, `ug`, `vi`, `vi@collation=traditional`, `wae`, `cy`,
        `yi`, `yi@collation=search`, `yo`, `zu`,
      ],
      strength: [
        1, 2, 3, 4, 5,
      ],
      default: {
        locale: `simple`,
        caseLevel: false,
        caseFirst: `off`,
        strength: 3,
        numericOrdering: false,
        alternate: `non-ignorable`,
        maxVariable: `punct`,
        normalization: false,
        backwards: false,
      },
    };
  };

  /** Define deploy object */
  const _id = `$Collation`;
  const version = `2.0.0`;
  const changelog = {
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Collation = Object.assign(${$Collation}, (${$CollationExt})());
  $Collation.prototype = (${__$Collation__})();
  $Collation.toString = $Collation[util.inspect.custom] = function () {return this.prototype.help()};
  $Collation.prototype.toString = $Collation.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Collation);
  global.$Collation = $Collation;
}`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
