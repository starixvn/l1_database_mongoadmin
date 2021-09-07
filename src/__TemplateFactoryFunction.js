{
  const $Class = function () {
    /** Self construct */
    if (!(this instanceof $Class)) return new $Class(...arguments);

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
      [util.inspect.custom] : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      func                  : Object.assign({value: function () { return _func    (...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const $ClassExt = function () {
    return {};
  };
  const __$Class__ = function () {
    return {
      help: function () {
        return `\
[$Class]
  .func()
`;
      },
    };
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
  const $Class = Object.assign(${$Class}, (${$ClassExt})());
  $Class.prototype = (${__$Class__})();
  $Class.toString = $Class[util.inspect.custom] = function () {return this.prototype.help()};
  $Class.prototype.toString = $Class.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Class);
  return $Class;
})()`);

  /** Deploy */
  $Deploy(`FACTORY`).run(_id, version, changelog, value);
}
