{
  const $Deploy = function (dbName) {
    /** Self construct */
    if (!(this instanceof $Deploy)) return new $Deploy(...arguments);

    /** Private constant */
    const global = Function('return this;')();
    const prefix = dbName || 'script';
    let label = prefix;

    /** Basic function */
    const _toString = () => {
      return `Deployment object on database [${prefix}]`;
    };

    /** Private function */
    const _log = (label, title, message, type, newline) => {
      const d  = ISODate().toISOString().padEnd(29);
      const t  = ((typeof type != "string") ? 'V' : type.trim().substr(0,1)).toUpperCase().padEnd(3);
      const l  = label.padEnd(20);
      const tt = (typeof title != "string") ? ' ' : title;
      const m  = (typeof message != "string") ? tojson(message) : message;

      print(`${d}${t}${l} [${tt}] • ${m}`);
    };
    const _logUpserted = (value, _id, version) => {
      if (value) {
        _log(label, `Created`, `[${_id}@${version}]`, `I`, true);
      }
    }
    const _logModified = (value, _id, lastVersion, version) => {
      if (value) {
        _log(label, `Modified`, `[${_id}@${lastVersion.version}] => [${_id}@${version}]`, `I`, true);
      }
    }
    const _runLocal = (_id, version, value) => {
      execute(value);
      _log(label, `Local`, `[${_id}@${version}]`);
    }
    const _runServer = (_id, version, changelog, value) => {
      const dbs = DBs(global.db);
      const lastVersion = dbs[dbName].system.js.findOne({_id}, {_id: 0, version: 1});
      const res = dbs[dbName].system.js.updateOne({_id}, {$set: {value, version, changelog}}, {upsert: true});

      _logUpserted(res.upsertedCount, _id, version);
      _logModified(res.modifiedCount, _id, lastVersion, version);
    }
    const _run = (_id, version, changelog, value) => {
      if (_id == null || value == null) return;
      label = `${prefix}-${_id.toUpperCase()}`;

      _runLocal(_id, version, value);
      if (!!global.db) {
        _runServer(_id, version, changelog, value);
      }
    }

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      run                   : Object.assign({value: function () { return _run     (...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const __$Deploy__ = function () {
    return {
      help: function () {
        return `\
[$Deploy](dbName) - Object helper for deploying script to database {dbName} on server
  .run(_id, version, changelog, value)  - Deploy script to current session and to server if connected
`;
      },
    };
  };
  const $DeployExt = function () {
    return {
      is$Deploy: function () {
        return $Schema($Deploy).test(...arguments);
      },
    };
  };

  /** Define deploy object */
  const _id = `$Deploy`;
  const version = `2.0.0`;
  const changelog = {
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Deploy = Object.assign(${$Deploy}, (${$DeployExt})());
  $Deploy.prototype = (${__$Deploy__})();
  $Deploy.toString = $Deploy[util.inspect.custom] = function () {return this.prototype.help()};
  $Deploy.prototype.toString = $Deploy.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Deploy);
  global.$Deploy = $Deploy;
}`);

  /** Deploy */
  $Deploy(`BASE`).run(_id, version, changelog, value);
}
