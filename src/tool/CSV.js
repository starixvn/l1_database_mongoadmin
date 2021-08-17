{
  const $CSV = function (file) {
    /** Self construct */
    if (!(this instanceof $CSV)) return new $CSV(file);

    /** Private constant */
    const _logger = new $Log(`CSV`);
    const _assert = new $Assert();
    _assert.setLogger(_logger);

    /** Private variable */
    let _file = ``;
    let _content = [];

    /** Basic function */
    const _toString = () => {
      return `[$CSV] Reading from file: ${_file}`;
    };

    /** Private function */
    const _setFile = (file) => {
      _file = file;
    };
    const _check = () => {
      _assert.setTitle(`Audit`);
      _assert.try(
        `Cannot read non-existent file: ${_file}`,
        fileExists(_file),
      );
      return !_assert.hasError();
    };
    const _line2array = (line) => {
      let data = [];
      if (typeof line == "string") {
        data = line.split(/,/);
      }
      return data;
    };
    const _loadContent = () => {
      if (!_check()) return;
      const _title = `Load Content`;
      const _timer = $Timer();

      _logger.info(_title, `Reading from file [${_file}]...`);
      _content = [];
      _content = cat(_file).split(/\r\n|\n/).map(_line2array);
      _logger.info(_title, `Finish reading ${(_content || []).length} lines in ${_timer.getTimerDuration()} ms.`);
    };
    const _getContent = () => {
      return _content;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString    : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson      : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      setFile     : Object.extend({value: function (...p) { return _setFile(...p) }}, _descriptor),
      loadContent : Object.extend({value: function (...p) { return _loadContent(...p) }}, _descriptor),
      getContent  : Object.extend({value: function (...p) { return _getContent(...p) }}, _descriptor),
    });

    _setFile(file);
    $Object.deepFreeze(this);
    return this;
  };
  const __$CSV__ = $CSV.prototype = {
    help: function () {
      return `\
[$CSV](file) - load CSV content from file
  .setFile(file) - set CSV file path
  .loadContent() - load content from file
  .getContent() - return loaded content
`;
    },
  };

  /** Define deploy object */
  const _id = `$CSV`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $CSV = ${tojson($CSV)};
  $CSV.prototype = ${tojson(__$CSV__)};
  $CSV.toString = $CSV.tojson = function () {return this.prototype.help()};
  $CSV.prototype.toString = $CSV.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($CSV);
  return $CSV;
})()`);

  /** Deploy */
  $Deploy(`TOOL`).run(_id, version, changelog, value);
}