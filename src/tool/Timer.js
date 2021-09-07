{
  const $Timer = function () {
    /** Self construct */
    if (!(this instanceof $Timer)) return new $Timer();

    /** Private constant */
    const data = {};

    /** Basic function */
    const _toString = () => {
      return `[$Timer] Started at ${_getISOTimer(this.CONST.START)}`;
    };

    /** Private function */
    const _register = (label) => {
      data[label] = Date.now();
    };
    const _startTimer = () => {
      _register(this.CONST.START);
    };
    const _stopTimer = () => {
      _register(this.CONST.FINISH);
    };
    const _getTimer = (label) => {
      return data[label];
    };
    const _getISOTimer = (label) => {
      return new Date(_getTimer(label) || null).toISOString();
    };
    const _getElapsedDuration = (label) => {
      return Date.now() - data[label];
    };
    const _getDifferent = (fromLabel, toLabel) => {
      return data[toLabel] - data[fromLabel];
    };
    const _getDuration = (label) => {
      return _getDifferent(this.CONST.START, label);
    };
    const _getTimerDuration = () => {
      let duration =  _getElapsedDuration(this.CONST.START);
      if (_getTimer(this.CONST.FINISH)) {
        duration = _getDuration(this.CONST.FINISH);
      }
      return duration;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString          (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString          (...arguments) }}, _descriptor),
      register              : Object.assign({value: function () { return _register          (...arguments) }}, _descriptor),
      startTimer            : Object.assign({value: function () { return _startTimer        (...arguments) }}, _descriptor),
      stopTimer             : Object.assign({value: function () { return _stopTimer         (...arguments) }}, _descriptor),
      getTimer              : Object.assign({value: function () { return _getTimer          (...arguments) }}, _descriptor),
      getISOTimer           : Object.assign({value: function () { return _getISOTimer       (...arguments) }}, _descriptor),
      getElapsedDuration    : Object.assign({value: function () { return _getElapsedDuration(...arguments) }}, _descriptor),
      getDifferent          : Object.assign({value: function () { return _getDifferent      (...arguments) }}, _descriptor),
      getDuration           : Object.assign({value: function () { return _getDuration       (...arguments) }}, _descriptor),
      getTimerDuration      : Object.assign({value: function () { return _getTimerDuration  (...arguments) }}, _descriptor),
    });

    _startTimer();
    Object.deepFreeze(this);
    return this;
  };
  const $TimerExt = function () {
    return {};
  };
  const __$Timer__ = function () {
    return {
      CONST: {
        START: '_start',
        FINISH: '_finish',
      },
      help: function () {
        return `\
[$Timer] - track time easier
  .register(label)                  - register custom label
  .startTimer()                     - start timer
  .stopTimer()                      - stop timer
  .getTimer(label)                  - return custom label value as epoch
  .getISOTimer(label)               - return custom label value as ISO string
  .getElapsedDuration(label)        - return elapsed time in ms since custom label registered
  .getDifferent(fromLabel, toLabel) - return different time in ms between 2 labels
  .getDuration(label)               - return duration of custom label in ms since timer start
  .getTimerDuration()               - return duration of the timer in ms since its start
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Timer`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Timer = Object.assign(${$Timer}, (${$TimerExt})());
  $Timer.prototype = (${__$Timer__})();
  $Timer.toString = $Timer[util.inspect.custom] = function () {return this.prototype.help()};
  $Timer.prototype.toString = $Timer.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Timer);
  return $Timer;
})()`);

  /** Deploy */
  $Deploy(`TOOL`).run(_id, version, changelog, value);
}
