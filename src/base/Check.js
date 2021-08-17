{
  const $Check = function () {
    /** Self construct */
    if (!(this instanceof $Check)) return new $Check();

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

    Object.extend(this, $Check);
    $Object.deepFreeze(this);
    return this;
  };
  const __$Check__ = $Check.prototype = {
    help: function () {
      return `\
[$Check]
  .isObject(obj)
  .isNotObject(obj)
  .isFunction(obj)
  .isNotFunction(obj)
  .isArray(obj)
  .isNotArray(obj)
  .isTrue(obj)
  .isFalse(obj)
  .isNull(obj)
  .isNotNull(obj)
`;
    },
  };
  const $CheckExt = {
    isObject: (obj) => {
      return typeof obj == "object";
    },
    isNotObject: (obj) => {
      return !$Check.isObject(obj);
    },
    isFunction: (obj) => {
      return typeof obj == "function";
    },
    isNotFunction: (obj) => {
      return !$Check.isFunction(obj);
    },
    isArray: (obj) => {
      return Array.isArray(obj);
    },
    isNotArray: (obj) => {
      return !Array.isArray(obj);
    },
    isTrue: (obj) => {
      return !!obj;
    },
    isFalse: (obj) => {
      return !obj;
    },
    isNull: (obj) => {
      return obj == null;
    },
    isNotNull: (obj) => {
      return obj != null;
    },
  };

  /** Define deploy object */
  const _id = `$Check`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Check = Object.extend(${tojson($Check)}, ${tojson($CheckExt)});
  $Check.prototype = ${tojson(__$Check__)};
  $Check.toString = $Check.tojson = function () {return this.prototype.help()};
  $Check.prototype.toString = $Check.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Check);
  return $Check;
})()`);

  /** Deploy */
  $Deploy(`BASE`).run(_id, version, changelog, value);
}