{
  const $Object = function () {
    /** Self construct */
    if (!(this instanceof $Object)) return new $Object();

    /** Basic function */
    const _toString = () => {
      return this.help();
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString: Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson  : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
    });

    Object.extend(this, $Object);
    $Object.deepFreeze(this);
    return this;
  };
  const __$Object__ = {
    help: () => {
      return `\
[$Object]
  .deepFreeze(obj)
  .sortProperties(obj)
  .typeof(obj)
`;
    },
  };
  const $ObjectExt = {
    deepFreeze: (obj) => {
      if ((typeof obj == "object") + (typeof obj == "function") > 0) {
        Object.getOwnPropertyNames(obj).forEach(k => {
          if (k !== "constructor") {
            $Object.deepFreeze(obj[k]);
          }
        });
      }
      Object.freeze(obj);
    },
    sortProperties: (obj) => {
      return Object.keys(obj).sort().reduce(
        (accumulator, currentValue, index, array) => {
          accumulator[currentValue] = obj[currentValue];
          return accumulator;
        },
        {},
      );
    },
    typeof: (obj) => {
      return typeof obj;
    },
    toArrayIfNot: (obj) => {
      return Array.isArray(obj) ? obj : [obj];
    },
    valueOf: (obj) => {
      return obj.valueOf();
    },
    filterEqualUsingValueOf: function (obj) {
      if (obj == null) {
        return false;
      }
      return this.arr.map($Object.valueOf).indexOf(obj.valueOf()) >= 0;
    },
    filterNotEqualUsingValueOf: function (obj) {
      if (obj == null) {
        return false;
      }
      return this.arr.map($Object.valueOf).indexOf(obj.valueOf()) < 0;
    },
  };

  /** Define deploy object */
  const _id = `$Object`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Object = Object.extend(${tojson($Object)}, ${tojson($ObjectExt)});
  $Object.prototype = ${tojson(__$Object__)};
  $Object.toString = $Object.tojson = () => {return this.prototype.help()};
  $Object.prototype.toString = $Object.prototype.tojson = () => {return this.help()};
  $Object.deepFreeze($Object);
  return $Object;
})()`);

  /** Deploy */
  $Deploy(`BASE`).run(_id, version, changelog, value);
}