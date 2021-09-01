{
  const $ExtDate = function (value) {
    /** Self construct */
    if (!(this instanceof $ExtDate)) return new $ExtDate(value);

    /** Private constant */
    const _logger = $Log(`EXTENDED-DATE`);
    const _regexp = /^([0-9]{4})-([0-9]{2})-([0-9]{2})([ ]|[T])([0-9]{2}):([0-9]{2}):([0-9]{2})([.][0-9]{0,9})?(Z|[+-]?[0-9]{2}[:]?[0-9]{2})?$/;

    /** Private variable */
    let _value = 0;
    let _parts = null;

    /** Basic function */
    const _toString = () => {
      if (_parts == null) {
        return 'Invalid Date';
      }
      return `\
${_parts.year   .toString().padStart(4,'0')}-\
${_parts.month  .toString().padStart(2,'0')}-\
${_parts.date   .toString().padStart(2,'0')}T\
${_parts.hour   .toString().padStart(2,'0')}:\
${_parts.minute .toString().padStart(2,'0')}:\
${_parts.second .toString().padStart(2,'0')}\
${_parts.subsecond}${_parts.timezone}\
`;
    };
    const _valueOf = () => {
      return _value;
    };

    /** Private function */
    const _parse = (value) => {
      const parsed = _regexp.exec(value);
      const parts = {};

      if (parsed == null) {
        parts = null;
      }

      parts.year      = Number(parsed[1]);
      parts.month     = Number(parsed[2]);
      parts.date      = Number(parsed[3]);
      parts.hour      = Number(parsed[5]);
      parts.minute    = Number(parsed[6]);
      parts.second    = Number(parsed[7]);
      parts.subsecond = parsed[8] ? parsed[8] : '';
      parts.timezone  = parsed[9] ? parsed[9] : '';

      return parts;
    };
    const _toDate = () => {
      return new Date(_value);
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      valueOf               : Object.assign({value: function () { return _valueOf (...arguments) }}, _descriptor),
      toDate                : Object.assign({value: function () { return _toDate  (...arguments) }}, _descriptor),
    });

    if (typeof value === "string") {
      _parts = _parse(value);
      _value = Date.parse(value) + (_parts && _parts.subsecond ? (_parts.subsecond * 1000) % 1 : 0);
    }
    if (typeof value === "number") {
      _parts = _parse((new Date(value)).toISOString());
      _value = value;
    }
    if (value == null) {
      const v = Date.now();
      _parts = _parse((new Date(v)).toISOString());
      _value = v;
    }

    Object.deepFreeze(this);
    return this;
  };
  const $ExtDateExt = function () {
    return {};
  };
  const __$ExtDate__ = function () {
    return {
      help: function () {
        return `\
[$ExtDate](value) - Extended data type for handling date string
  .toDate() - return built-in Date() object
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$ExtDate`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $ExtDate = Object.assign(${$ExtDate}, (${$ExtDateExt})());
  $ExtDate.prototype = (${__$ExtDate__})();
  $ExtDate.toString = $ExtDate.tojson = function () {return this.prototype.help()};
  $ExtDate.prototype.toString = $ExtDate.prototype.tojson = function () { return this.help(); }

  Object.deepFreeze($ExtDate);
  return $ExtDate;
})()`);

  /** Deploy */
  $Deploy(`TYPE`).run(_id, version, changelog, value);
}
