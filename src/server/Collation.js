{
  const $Collation = function (locale, strength) {
    /** Self construct */
    if (!(this instanceof $Collation)) return new $Collation(locale, strength);

    /** Private constant */
    const value = Object.extend({}, this.default);

    /** Basic function */
    const _toString = () => {
      return `[$Collation]`;
    };

    /** Private function */
    const _load = (collation) => {
      if (!collation) return;
      Object.keys(this.default).forEach(_ => {
        if (collation[_] != null) {
          value[_] = collation[_];
        }
      });
      return this;
    };
    const _setLocale = (locale) => {
      if (this.locale.indexOf(locale) >= 0) {
        value.locale = locale;
      }
    };
    const _setStrength = (strength) => {
      if (this.strength.indexOf(strength) >= 0) {
        value.strength = strength;
      }
    };
    const _getFull = () => {
      return value;
    };
    const _getSimple = () => {
      const result = Object.extend({}, value);
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
      toString    : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson      : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      load        : Object.extend({value: function (...p) { return _load(...p) }}, _descriptor),
      setLocale   : Object.extend({value: function (...p) { return _setLocale(...p) }}, _descriptor),
      setStrength : Object.extend({value: function (...p) { return _setStrength(...p) }}, _descriptor),
      getFull     : Object.extend({value: function (...p) { return _getFull(...p) }}, _descriptor),
      getSimple   : Object.extend({value: function (...p) { return _getSimple(...p) }}, _descriptor),
    });

    _setLocale(locale);
    _setStrength(strength);
    $Object.deepFreeze(this);
    return this;
  };
  const __$Collation__ = $Collation.prototype = {
    help: function () {
      return `\
[$Collation] - Collation helper
  .load(collation) - load external collation object
  .setLocale(locale) - set locale
  .setStrength(strength) - set strength
  .getFull() - return full collation object
  .getSimple() - return minimal collation object
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
    }
  };
  const $CollationExt = {
    toSimple: (obj) => {
      if ($Collation.is$Collation(obj)) {
        return obj.toSimple();
      }
      return null;
    },
    is$Collation: (obj) => {
      return $Schema({'!data': $Collation}).test({data: obj});
    },
  };

  /** Define deploy object */
  const _id = `$Collation`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Collation = Object.extend(${tojson($Collation)}, ${tojson($CollationExt)});
  $Collation.prototype = ${tojson(__$Collation__)};
  $Collation.toString = $Collation.tojson = function () {return this.prototype.help()};
  $Collation.prototype.toString = $Collation.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Collation);
  return $Collation;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}