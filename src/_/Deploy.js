{
  const $Deploy = function (dbName) {
    /** Self construct */
    if (!(this instanceof $Deploy)) return new $Deploy(dbName);

    /** Private constant */
    const global = Function('return this;')();
    const prefix = dbName || 'script';
    let label = prefix;

    /** Basic function */
    const _toString = () => {
      return `Deployment object on database [${prefix}]`;
    };

    /** Private function */
    const _deepFreeze = (obj) => {
      if ((typeof obj == "object") + (typeof obj == "function") > 0) {
        Object.getOwnPropertyNames(obj).forEach(k => {
          if (k !== "constructor") {
            _deepFreeze(obj[k]);
          }
        });
      }
      Object.freeze(obj);
    };
    const _log = (label, title, message, type) => {
      const d  = ISODate().toISOString().pad(29,1);
      const t  = ((typeof type != "string") ? 'V' : type.ltrim().substr(0,1)).toUpperCase().pad(3,1);
      const tt = (typeof title != "string") ? ' ' : title;
      const m  = (typeof message != "string") ? tojson(message) : message;

      print(`${d}${t}${label} [${tt}] • ${m}`);
    };
    const _logUpserted = (value, _id, version) => {
      if (value) {
        _log(label, `Created`, `[${_id}@${version}]`);
      }
    }
    const _logModified = (value, _id, lastVersion, version) => {
      if (value) {
        _log(label, `Modified`, `[${_id}@${lastVersion.version}] => [${_id}@${version}]`);
      }
    }
    const _runLocal = (_id, version, value) => {
      global[_id] = eval("(" + value.code + ")");
      _log(label, `Local`, `[${_id}@${version}]`);
    }
    const _runServer = (_id, version, changelog, value) => {
      const lastVersion = global.db.getSiblingDB(dbName).system.js.findOne({_id}, {_id: 0, version: 1});
      const res = global.db.getSiblingDB(dbName).system.js.save({_id, value, version, changelog});

      _logUpserted(res.nUpserted, _id, version);
      _logModified(res.nModified, _id, lastVersion, version);

      global.db.getSiblingDB(dbName).loadServerScripts();
    }
    const _run = (_id, version, changelog, value) => {
      label = `${prefix}-${_id.toUpperCase().pad(10,1)}`;

      if (!global.db) {
        _runLocal(_id, version, value);
      }
      if (global.db) {
        _runServer(_id, version, changelog, value);
      }
    }

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString  : Object.extend({value: function (...p) { return _toString  (...p) }}, _descriptor),
      tojson    : Object.extend({value: function (...p) { return _toString  (...p) }}, _descriptor),
      run       : Object.extend({value: function (...p) { return _run       (...p) }}, _descriptor),
      deepFreeze: Object.extend({value: function (...p) { return _deepFreeze(...p) }}, _descriptor),
    });

    _deepFreeze(this);
    return this;
  };
  const __$Deploy__ = $Deploy.prototype = {
    help: function () {
      return `\
[$Deploy](dbName)
  .run(_id, version, changelog, value)
`;
    },
  };
  const $DeployExt = {
    is$Deploy: (obj) => {
      return $Schema({'!data': $Deploy}).test({data: obj});
    },
  };

  /** Define deploy object */
  const _id = `$Deploy`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Deploy = Object.extend(${tojson($Deploy)}, ${tojson($DeployExt)});
  $Deploy.prototype = ${tojson(__$Deploy__)};
  $Deploy.toString = $Deploy.tojson = function () {return this.prototype.help()};
  $Deploy.prototype.toString = $Deploy.prototype.tojson = function () { return this.help(); }

  $Deploy().deepFreeze($Deploy);
  return $Deploy;
})()`);

  /** Deploy */
  $Deploy(`BASE`).run(_id, version, changelog, value);
}