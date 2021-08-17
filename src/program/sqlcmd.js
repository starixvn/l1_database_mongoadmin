{
  const $sqlcmd = function (obj) {
    /** Self construct */
    if (!(this instanceof $sqlcmd)) return new $sqlcmd(obj);

    /** Private constant */
    const _logger = $Log(`sqlcmd`);
    const _assert = $Assert();
    _assert.setLogger(_logger);

    const _args = {
      prog    : [`sqlcmd`],
      host    : [`-H`, `Mongo`],  // -H
      srv     : [],               // -S
      db      : [],               // -d
      usr     : [],               // -U
      pwd     : [],               // -P
      query   : [],               // -Q
      header  : [],               // -h
      colsep  : [],               // -s
      output  : [],               // -o
      err     : [`-m-1`],         // -m
      flags   : [
        `-I`,                     // -I (enable quoted identifiers)
        `-W`,                     // -W (remove trailing spaces)
        `-b`,                     // -b (terminate batch job if there is an error)
      ],
    };

    /** Private variable */
    let _ok = false;

    /** Basic function */
    const _toString = () => {
      if (!_ok) {
        return this.help();
      }
      return `\
[$sqlcmd]
srv    : ${_args.srv[1]}
db     : ${_args.db[1]}
usr    : ${_args.usr[1]}
pwd    : ${_hideValue(_args.pwd[1], '********')}
query  : ${_hideValue(_args.query[1], '<QUERY>')}
header : ${_args.header[1]}
colsep : ${_args.colsep[1]}
output : ${_args.output[1]}
`;
    };

    /** Private function */
    const _hideValue = (value, replacement) => {
      return value ? replacement : value;
    };
    const _runTestProg = () => {
      if (_isWindows()) {
        run(`cmd`, `/C`, `${_args.prog[0]} -? > nul`);
      } else {
        run(`bash`, `-c`, `${_args.prog[0]} -? > /dev/null`);
      }
    };
    const _testProg = () => {
      try {
        _runTestProg();
        clearRawMongoProgramOutput();
        _ok = true;
      } catch (e) {
        _logger.err(`Audit`, e.valueOf());
        throw(e);
      };
    };
    const _setServer = (obj) => {
      const _obj = Object.extend({}, typeof obj == "string" ? {srv: obj} : obj);
      _args.srv = _obj.srv ? [`-S`, _obj.srv] : _args.srv;
    };
    const _setDatabase = (obj) => {
      const _obj = Object.extend({}, typeof obj == "string" ? {db: obj} : obj);
      _args.db = _obj.db ? [`-d`, _obj.db] : _args.db;
    };
    const _setLogin = (obj) => {
      const _obj = Object.extend({}, obj);
      _args.usr = _obj.usr ? [`-U`, _obj.usr] : _args.usr;
      _args.pwd = _obj.pwd ? [`-P`, _obj.pwd] : _args.pwd;
    };
    const _setQuery = (obj) => {
      const _obj = Object.extend({}, typeof obj == "string" ? {query: obj} : obj);
      _args.query = _obj.query ? [`-Q`, `SET NOCOUNT ON;\n${_obj.query}`] : _args.query;
    };
    const _setHeader = (obj) => {
      const _obj = Object.extend({}, typeof obj == "string" ? {header: obj} : obj);
      _args.header = _obj.header ? [`-h`, _obj.header] : _args.header;
    };
    const _setColSeparator = (obj) => {
      const _obj = Object.extend({}, typeof obj == "string" ? {colsep: obj} : obj);
      _args.colsep = _obj.colsep ? [`-s`, _obj.colsep] : _args.colsep;
    };
    const _setOutput = (obj) => {
      const _obj = Object.extend({}, typeof obj == "string" ? {output: obj} : obj);
      _args.output = _obj.output ? [`-o`, _obj.output] : _args.output;
    };
    const _CSVOutput = () => {
      _setHeader(`-1`);
      _setColSeparator(`,`);
    };
    const _delOutput = () => {
      if (!_args.output[1]) {
        return;
      }

      removeFile(_args.output[1]);
      _logger.warn(`Delete Output`, `File [${_args.output[1]}] deleted.`);
    };
    const _reduceParam = (accumulator, currentValue, index, array) => {
      if ((! _args[currentValue][0] in ['prog', 'flags']) && _args[currentValue][1] == null) {
        return accumulator;
      }
      return [...accumulator, ..._args[currentValue]];
    };
    const _execute = () => {
      const cmd = Object.keys(_args).reduce(_reduceParam, []);
      _logger.info(`Execute`, `Starting ${cmd[0]}...`);
      const r = run(...cmd);
      if (_args.output[1] && fileExists(_args.output[1])) {
        _logger.warn(`Execute`, `File [${_args.output[1]}] created.`);
      }
      return r;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString        : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson          : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      setServer       : Object.extend({value: function (...p) { return _setServer(...p) }}, _descriptor),
      setDatabase     : Object.extend({value: function (...p) { return _setDatabase(...p) }}, _descriptor),
      setLogin        : Object.extend({value: function (...p) { return _setLogin(...p) }}, _descriptor),
      setQuery        : Object.extend({value: function (...p) { return _setQuery(...p) }}, _descriptor),
      setHeader       : Object.extend({value: function (...p) { return _setHeader(...p) }}, _descriptor),
      setColSeparator : Object.extend({value: function (...p) { return _setColSeparator(...p) }}, _descriptor),
      setOutput       : Object.extend({value: function (...p) { return _setOutput(...p) }}, _descriptor),
      CSVOutput       : Object.extend({value: function (...p) { return _CSVOutput(...p) }}, _descriptor),
      delOutput       : Object.extend({value: function (...p) { return _delOutput(...p) }}, _descriptor),
      execute         : Object.extend({value: function (...p) { return _execute(...p) }}, _descriptor),
    });

    _testProg();
    _setServer(obj);
    _setDatabase(obj);
    _setLogin(obj);
    _setQuery(obj);
    _setHeader(obj);
    _setColSeparator(obj);
    _setOutput(obj);
    if (Object.extend({}, obj).csv) {
      _CSVOutput();
    }
    $Object.deepFreeze(this);
    return this;
  };
  const __$sqlcmd__ = $sqlcmd.prototype = {
    help: function () {
      return `\
[$sqlcmd](obj) - run sqlcmd program
  obj = {
    srv:    [server]      , db:     [use database name],
    usr:    [login id]    , pwd:    [password],
    query:  ["cmdline query" and exit],
    header: [headers]     , colsep: [colseparator],
    output: [outputfile]  , csv:    [output in csv format],
  }
  .setServer(obj) - set server to connect to
  .setDatabase(obj) - set database to connect to
  .setLogin(obj) - set credential
  .setQuery(obj) - set query to be executed
  .setHeader(obj) - set headers option
  .setColSeparator(obj) - set column separator for returned data
  .setOutput(obj) - set output file
  .CSVOutput() - configure options to return csv format
  .delOutput() - delete output file
  .execute() - run sqlcmd with options
`;
    },
  };

  /** Define deploy object */
  const _id = `$sqlcmd`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $sqlcmd = ${tojson($sqlcmd)};
  $sqlcmd.prototype = ${tojson(__$sqlcmd__)};
  $sqlcmd.toString = $sqlcmd.tojson = function () {return this.prototype.help()};
  $sqlcmd.prototype.toString = $sqlcmd.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($sqlcmd);
  return $sqlcmd;
})()`);

  /** Deploy */
  $Deploy(`PROG`).run(_id, version, changelog, value);
}