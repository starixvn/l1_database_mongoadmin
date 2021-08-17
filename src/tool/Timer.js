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
      toString          : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson            : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      register          : Object.extend({value: function (...p) { return _register(...p) }}, _descriptor),
      startTimer        : Object.extend({value: function (...p) { return _startTimer(...p) }}, _descriptor),
      stopTimer         : Object.extend({value: function (...p) { return _stopTimer(...p) }}, _descriptor),
      getTimer          : Object.extend({value: function (...p) { return _getTimer(...p) }}, _descriptor),
      getISOTimer       : Object.extend({value: function (...p) { return _getISOTimer(...p) }}, _descriptor),
      getElapsedDuration: Object.extend({value: function (...p) { return _getElapsedDuration(...p) }}, _descriptor),
      getDifferent      : Object.extend({value: function (...p) { return _getDifferent(...p) }}, _descriptor),
      getDuration       : Object.extend({value: function (...p) { return _getDuration(...p) }}, _descriptor),
      getTimerDuration  : Object.extend({value: function (...p) { return _getTimerDuration(...p) }}, _descriptor),
    });

    _startTimer();
    $Object.deepFreeze(this);
    return this;
  };
  const __$Timer__ = $Timer.prototype = {
    CONST: {
      START: '_start',
      FINISH: '_finish',
    },
    help: function () {
      return `\
[$Timer] - track time easier
  .register(label) - register custom label
  .startTimer() - start timer
  .stopTimer() - stop timer
  .getTimer(label) - return custom label value as epoch
  .getISOTimer(label) - return custom label value as ISO string
  .getElapsedDuration(label) - return elapsed time in ms since custom label registered
  .getDifferent(fromLabel, toLabel) - return different time in ms between 2 labels
  .getDuration(label) - return duration of custom label in ms since timer start
  .getTimerDuration() - return duration of the timer in ms since its start
`;
    },
  };

  /** Define deploy object */
  const _id = `$Timer`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Timer = ${tojson($Timer)};
  $Timer.prototype = ${tojson(__$Timer__)};
  $Timer.toString = $Timer.tojson = function () {return this.prototype.help()};
  $Timer.prototype.toString = $Timer.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($Timer);
  return $Timer;
})()`);

  /** Deploy */
  $Deploy(`TOOL`).run(_id, version, changelog, value);
}