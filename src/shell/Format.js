{
  const $Format = function () {
    /** Self construct */
    if (!(this instanceof $Format)) return new $Format();

    /** Private constant */
    const _compatibility = !_isWindows();

    /** Private function */
    const _toString = () => {
      return `[$Format] Compatibility: ${_compatibility}`;
    };
    const _isCompatible = () => {
      return _compatibility;
    };
    const _isApllying = (color) => {
      return _compatibility && this.CONST[color.toUpperCase()];
    };
    const _end = (color) => {
      let str = ``;
      if (_isApllying(color)) {
        str = `${this.CONST.ESC}${this.CONST.MOD}`;
      }
      return str;
    };
    const _code = (color) => {
      let str = ``;
      if (_isApllying(color)) {
        str = `${this.CONST.ESC}${this.CONST[color.toUpperCase()]}${this.CONST.MOD}`;
      }
      return str;
    };
    const _format = (text, color) => {
      return `${_code(color)}${text || ''}${_end(color)}`;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      help        : Object.extend({value: function () { return _help() }}, _descriptor),
      toString    : Object.extend({value: function () { return _toString() }}, _descriptor),
      tojson      : Object.extend({value: function () { return _toString() }}, _descriptor),
      isCompatible: Object.extend({value: function () { return _isCompatible() }}, _descriptor),
      format      : Object.extend({value: function (text, color) { return _format(text, color) }}, _descriptor),
    });

    $Object.deepFreeze(this);
    return this;
  };
  __$Format__ = $Format.prototype = {
    CONST: {
      ESC           : String.fromCharCode(0x1B) + '[',
      MOD           : 'm',
      BLACK         : 30,
      RED           : 31,
      GREEN         : 32,
      YELLOW        : 33,
      BLUE          : 34,
      MAGENTA       : 35,
      CYAN          : 36,
      WHITE         : 37,
      BRIGHTBLACK   : 90,
      BRIGHTRED     : 91,
      BRIGHTGREEN   : 92,
      BRIGHTYELLOW  : 93,
      BRIGHTBLUE    : 94,
      BRIGHTMAGENTA : 95,
      BRIGHTCYAN    : 96,
      BRIGHTWHITE   : 97,
    },
    help: () => {
      return `\
[$Format] - Add formating symbol to existing text
  .isCompatible() - check if current console support formatting
  .format(text, color) - return the formatted text if compatible
`;
    },
  };

  /** Define deploy object */
  const _id = `$Format`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Class = ${tojson($Format)};
  $Class.prototype = ${tojson(__$Format__)};
  $Class.toString = $Class.tojson = function () {return this.prototype.help()};
  $Class.prototype.toString = $Class.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Class);
  return $Class;
})()`);

  /** Deploy */
  $Deploy(`SHELL`).run(_id, version, changelog, value);
}