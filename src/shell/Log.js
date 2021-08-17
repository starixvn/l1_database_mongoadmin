{
  const $Log = function (label) {
    /** Self construct */
    if (!(this instanceof $Log)) return new $Log(label);

    /** Private constant */
    const _formatter = $Format();

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
      _label = (typeof label != "string") ? _label : label.toUpperCase().pad(8,1);
    };
    const _now = () => {
      return ISODate().toISOString().pad(29,1);
    };
    const _paint = (title, message, type, color) => {
      const d  = _now();
      const t  = ((typeof type != "string") ? 'V' : type.ltrim().substr(0,1)).toUpperCase().pad(3,1);
      const tt = (typeof title != "string") ? ' ' : title;
      const m  = (typeof message != "string") ? tojson(message) : message;

      const msg = `${d}${t}${_label} [${tt}] • ${m}`;
      print(_formatter.format(msg, color));
    };
    const _verbose = (title, message) => {
      const type = 'VERBOSE';
      _paint(title, message, type, this.CONST[type]);
    };
    const _info = (title, message) => {
        const type = 'INFO';
        _paint(title, message, type, this.CONST[type]);
    };
    const _warn = (title, message) => {
        const type = 'WARN';
        _paint(title, message, type, this.CONST[type]);
    };
    const _err = (title, message) => {
        const type = 'ERR';
        _paint(title, message, type, this.CONST[type]);
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString: Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson  : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      getLabel: Object.extend({value: function (...p) { return _getLabel(...p) }}, _descriptor),
      setLabel: Object.extend({value: function (...p) { return _setLabel(...p) }}, _descriptor),
      verbose : Object.extend({value: function (...p) { return _verbose(...p) }}, _descriptor),
      info    : Object.extend({value: function (...p) { return _info(...p) }}, _descriptor),
      warn    : Object.extend({value: function (...p) { return _warn(...p) }}, _descriptor),
      err     : Object.extend({value: function (...p) { return _err(...p) }}, _descriptor),
    });

    _setLabel(label);
    $Object.deepFreeze(this);
    return this;
  };
  const __$Log__ = $Log.prototype = {
    CONST: {
      VERBOSE : 'BRIGHTGREEN',
      INFO    : '',
      WARN    : 'BRIGHTYELLOW',
      ERR     : 'BRIGHTRED',
    },
    help: function () {
      return `\
[$Log](label) - Write log message
  .getLabel() - return log's label
  .setLabel(label) - update log's label
  .verbose(title, message) - write verbose message
  .info(title, message) - write infomation message
  .warn(title, message) - write warning message
  .err(title, message) - write error message
`;
    },
  };

  /** Define deploy object */
  const _id = `$Log`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Log = ${tojson($Log)};
  $Log.prototype = ${tojson(__$Log__)};
  $Log.toString = $Log.tojson = function () {return this.prototype.help()};
  $Log.prototype.toString = $Log.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Log);
  return $Log;
})()`);

  /** Deploy */
  $Deploy(`SHELL`).run(_id, version, changelog, value);
}