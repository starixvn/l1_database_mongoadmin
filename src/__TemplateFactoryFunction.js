{
  const $Class = function () {
    /** Self construct */
    if (!(this instanceof $Class)) return new $Class();

    /** Private constant */
    const global = Function('return this;')();

    /** Basic function */
    const _toString = () => {
      return `[$Class]`;
    };

    /** Private function */
    const _func = () => {
      return;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString: Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson  : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      func    : Object.extend({value: function (...p) { return _func(...p) }}, _descriptor),
    });

    $Object.deepFreeze(this);
    return this;
  };
  const __$Class__ = $Class.prototype = {
    help: function () {
      return `\
[$Class]
  .func()
`;
    },
  };
  const $ClassExt = {
    is$Class: (obj) => {
      return $Schema({'!data': $Class}).test({data: obj});
    },
  };

  /** Define deploy object */
  const _id = `$Class`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Class = Object.extend(${tojson($Class)}, ${tojson($ClassExt)});
  $Class.prototype = ${tojson(__$Class__)};
  $Class.toString = $Class.tojson = function () {return this.prototype.help()};
  $Class.prototype.toString = $Class.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Class);
  return $Class;
})()`);

  /** Deploy */
  $Deploy(`FACTORY`).run(_id, version, changelog, value);
}