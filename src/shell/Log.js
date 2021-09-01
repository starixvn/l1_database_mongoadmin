{
  const $Log = function (label) {
    /** Self construct */
    if (!(this instanceof $Log)) return new $Log(label);

    /** Private variable */
    let _label = 'VERBOSE ';

    /** Basic function */
    const _toString = () => {
      return `[$Log] Print log for (${_label})`;
    };

    /** Private function */
    const _getLabel = () => {
      return _label;
    };
    const _setLabel = (label) => {
      _label = (typeof label != "string") ? _label : label.toUpperCase().padEnd(8);
    };
    const _now = () => {
      return ISODate().toISOString().padEnd(29);
    };
    const _paint = (title, message, type, color) => {
      const d  = _now();
      const t  = ((typeof type != "string") ? 'V' : type.trim().substr(0,1)).toUpperCase().padEnd(3);
      const tt = (typeof title != "string") ? ' ' : title;
      const m  = (typeof message != "string") ? JSON.stringify(message) : message;

      const msg = `${d}${t}${_label} [${tt}] • ${m}`;
      console.log(msg);
    };
    const _verbose = (title, message) => {
      const type = 'VERBOSE';
      _paint(title, message, type);
    };
    const _info = (title, message) => {
        const type = 'INFO';
        _paint(title, message, type);
    };
    const _warn = (title, message) => {
        const type = 'WARN';
        _paint(title, message, type);
    };
    const _err = (title, message) => {
        const type = 'ERR';
        _paint(title, message, type);
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      getLabel              : Object.assign({value: function () { return _getLabel(...arguments) }}, _descriptor),
      setLabel              : Object.assign({value: function () { return _setLabel(...arguments) }}, _descriptor),
      verbose               : Object.assign({value: function () { return _verbose (...arguments) }}, _descriptor),
      info                  : Object.assign({value: function () { return _info    (...arguments) }}, _descriptor),
      warn                  : Object.assign({value: function () { return _warn    (...arguments) }}, _descriptor),
      err                   : Object.assign({value: function () { return _err     (...arguments) }}, _descriptor),
    });

    _setLabel(label);
    Object.deepFreeze(this);
    return this;
  };
  const $LogExt = function () {
    return {};
  };
  const __$Log__ = function () {
    return {
      help: function () {
        return `\
[$Log](label) - Write log message
  .getLabel()               - return log's label
  .setLabel(label)          - update log's label
  .verbose(title, message)  - write verbose message
  .info(title, message)     - write infomation message
  .warn(title, message)     - write warning message
  .err(title, message)      - write error message
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Log`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Log = Object.assign(${$Log}, (${$LogExt})());
  $Log.prototype = (${__$Log__})();
  $Log.toString = $Log.tojson = function () {return this.prototype.help()};
  $Log.prototype.toString = $Log.prototype.tojson = function () { return this.help(); }

  Object.deepFreeze($Log);
  return $Log;
})()`);

  /** Deploy */
  $Deploy(`SHELL`).run(_id, version, changelog, value);
}
