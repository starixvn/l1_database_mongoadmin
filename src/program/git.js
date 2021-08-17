{
  const $git = function () {
    /** Self construct */
    if (!(this instanceof $git)) return new $git();

    /** Private constant */
    const _logger = $Log(`git`);
    const _assert = $Assert();
    _assert.setLogger(_logger);

    const _args = {
      prog  : [`git`],
      flags : [],
    };

    /** Private variable */
    let _branches = [];

    /** Basic function */
    const _toString = () => {
      return this.help();
    };

    /** Private function */
    const _reduceParam = (accumulator, currentValue, index, array) => {
      if ((! _args[currentValue][0] in ['prog', 'flags']) && _args[currentValue][1] == null) {
        return accumulator;
      }
      return [...accumulator, ..._args[currentValue]];
    };
    const _execute = () => {
      clearRawMongoProgramOutput();
      const cmd = Object.keys(_args).reduce(_reduceParam, []);
      _logger.info(`Execute`, `Starting ${cmd[0]}...`);
      const r = run(...cmd);
      print(`\n`);
      return r;
    };
    const _parseMongoProgramOutput = (line) => {
      const _regexp = /^sh[0-9]*[|] (.*)$/;
      const arr = _regexp.exec(line);
      return arr ? arr[1].trim() : '';
    };
    const _filterEmpty = (line) => {
      return !!line;
    };
    const _getBranches = () => {
      _args.flags = [`branch`, `-a`];
      _execute();
      _branches = rawMongoProgramOutput().split(/\r\n|\n/).map(_parseMongoProgramOutput).filter(_filterEmpty);
      return _branches;
    };
    const _delBranch = (branch) => {
      _getBranches();
      _args.flags = [`branch`, `-d`, branch];
      _execute();
      _getBranches();
    };
    const _isCurrentBranch = (branch) => {
      return _branches.some(_ => _ == `* ${branch}`);
    };
    const _existLocal = (branch) => {
      return _branches.some(_ => _ == branch);
    };
    const _getRemoteBranch = (branch) => {
      const regexp = RegExp(`^remotes/.*/${branch}$`);
      const filtered = _branches.filter(_ => regexp.test(_));
      return filtered.length > 0 ? filtered[0] : null;
    };
    const _checkout = (branch) => {
      _getBranches();
      const remote = _getRemoteBranch(branch);
      if (remote) {
        _args.flags = [`checkout`, `-t`, remote];
      }
      if (_existLocal(branch)) {
        _args.flags = [`checkout`, branch];
      }
      if (_isCurrentBranch(branch)) {
        _args.flags = [`status`];
      }
      _execute();
      _getBranches();
    };
    const _pull = () => {
      _args.flags = [`pull`, `--rebase`];
      _execute();
    };
    const _status = () => {
      _args.flags = [`status`];
      _execute();
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString    : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson      : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      getBranches : Object.extend({value: function (...p) { return _getBranches(...p) }}, _descriptor),
      delBranch   : Object.extend({value: function (...p) { return _delBranch(...p) }}, _descriptor),
      checkout    : Object.extend({value: function (...p) { return _checkout(...p) }}, _descriptor),
      pull        : Object.extend({value: function (...p) { return _pull(...p) }}, _descriptor),
      status      : Object.extend({value: function (...p) { return _status(...p) }}, _descriptor),
    });

    $Object.deepFreeze(this);
    return this;
  };
  const __$git__ = $git.prototype = {
    help: function () {
      return `\
[$git]
  .status() - get current branch status
  .pull() - pull from remote with rebase option
  .getBranches() - get all branches
  .checkout(branch) - checkout branch
  .delBranch(branch) - delete local branch
`;
    },
  };

  /** Define deploy object */
  const _id = `$git`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $git = ${tojson($git)};
  $git.prototype = ${tojson(__$git__)};
  $git.toString = $git.tojson = function () {return this.prototype.help()};
  $git.prototype.toString = $git.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($git);
  return $git;
})()`);

  /** Deploy */
  $Deploy(`PROG`).run(_id, version, changelog, value);
}