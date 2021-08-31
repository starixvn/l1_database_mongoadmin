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
      const l  = label.padEnd(15);
      const tt = (typeof title != "string") ? ' ' : title;
      const m  = (typeof message != "string") ? tojson(message) : message;

      console.log(`${d}${t}${l} [${tt}] • ${m}`);
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
    const _runLocal = async (_id, version, value) => {
      global[_id] = eval("(" + value.code + ")");
      _log(label, `Local`, `[${_id}@${version}]`);
    }
    const _runServer = async (_id, version, changelog, value) => {
      const lastVersion = await global.dbs[dbName].system.js.findOne({_id}, {_id: 0, version: 1});
      const res = await global.dbs[dbName].system.js.updateOne({_id}, {$set: {value, version, changelog}}, {upsert: true});

      _logUpserted(res.upsertedCount, _id, version);
      _logModified(res.modifiedCount, _id, lastVersion, version);
    }
    const _run = async (_id, version, changelog, value) => {
      if (_id == null || value == null) return;
      label = `${prefix}-${_id.toUpperCase()}`;

      _runLocal(_id, version, value);
      if (!!global.db) {
        await _runServer(_id, version, changelog, value);
      }
    }

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString  : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      tojson    : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      run       : Object.assign({value: function () { return _run     (...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const __$Deploy__ = function () {
    return {
      help: function () {
        return `\
[$Deploy](dbName)
  .run(_id, version, changelog, value)
`;
      },
    };
  };
  const $DeployExt = function () {
    return {
      is$Deploy: (obj) => {
        return $Schema({'!data': $Deploy}).test({data: obj});
      },
    };
  };

  /** Define deploy object */
  const _id = `$Deploy`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Deploy = Object.assign(${$Deploy}, (${$DeployExt})());
  $Deploy.prototype = (${__$Deploy__})();
  $Deploy.toString = $Deploy.tojson = function () {return this.prototype.help()};
  $Deploy.prototype.toString = $Deploy.prototype.tojson = function () { return this.help(); }

  Object.deepFreeze($Deploy);
  return $Deploy;
})()`);

  /** Deploy */
  $Deploy(`BASE`).run(_id, version, changelog, value);
}
