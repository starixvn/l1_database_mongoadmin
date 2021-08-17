{
  const $Assert = function (title) {
    /** Self construct */
    if (!(this instanceof $Assert)) return new $Assert(title);

    /** Private variable */
    let _logger = $Log(`ASSERT`);
    let _title = ``;
    let _history = [];

    /** Basic function */
    const _toString = () => {
      return `[$Assert] ${_logger.getLabel()} - ${_title}`;
    };

    /** Private function */
    const _setLogger = (logger) => {
      _logger = (logger instanceof $Log) ? logger : _logger;
    };
    const _getTitle = () => {
      return _title;
    };
    const _setTitle = (title) => {
      _title = (typeof title != "string") ? _title : title;
      _resetHistory();
    };
    const _test = (msg, ...conds) => {
      if (!conds.every(eval)) {
        _logger.warn(_title, msg);
      }
    };
    const _try = (msg, ...conds) => {
      if (!conds.every(eval)) {
        _logger.err(_title, msg);
        const err = Error(msg);
        _history.push(err);
        return err;
      }
    };
    const _do = (msg, ...conds) => {
      const err = _try(msg, ...conds);
      if (err) {
        throw err;
      }
    };
    const _hasError = () => {
      if (_history.some(eval)) {
        return true;
      }
      return false;
    };
    const _resetHistory = () => {
      _history = [];
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString    : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson      : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      setLogger   : Object.extend({value: function (...p) { return _setLogger(...p) }}, _descriptor),
      getTitle    : Object.extend({value: function (...p) { return _getTitle(...p) }}, _descriptor),
      setTitle    : Object.extend({value: function (...p) { return _setTitle(...p) }}, _descriptor),
      test        : Object.extend({value: function (...p) { return _test(...p) }}, _descriptor),
      try         : Object.extend({value: function (...p) { return _try(...p) }}, _descriptor),
      do          : Object.extend({value: function (...p) { return _do(...p) }}, _descriptor),
      hasError    : Object.extend({value: function (...p) { return _hasError(...p) }}, _descriptor),
      resetHistory: Object.extend({value: function (...p) { return _resetHistory(...p) }}, _descriptor),
    });

    _setTitle(title || ``);
    $Object.deepFreeze(this);
    return this;
  };
  const __$Assert__ = $Assert.prototype = {
    help: function () {
      return `\
[$Assert](title) - do assert
  .setLogger(logger) - update logger object
  .getTitle() - return title
  .setTitle(title) - update title then clear error history
  .test(msg, ...conds) - evaluate conditions - PRINT warning if at least [1] condition failed
  .try(msg, ...conds) - evaluate conditions - PRINT & SAVE error if at least [1] condition failed
  .do(msg, ...conds) - evaluate conditions - PRINT, SAVE & THROW error if at least [1] condition failed
  .hasError() - check if there are errors in history
  .resetHistory() - clear error history
`;
    },
  };

  /** Define deploy object */
  const _id = `$Assert`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Assert = ${tojson($Assert)};
  $Assert.prototype = ${tojson(__$Assert__)};
  $Assert.toString = $Assert.tojson = function () {return this.prototype.help()};
  $Assert.prototype.toString = $Assert.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Assert);
  return $Assert;
})()`);

  /** Deploy */
  $Deploy(`SHELL`).run(_id, version, changelog, value);
}