{
  const $DBs = function (ref) {
    /** Self construct */
    if (!(this instanceof $DBs)) return new $DBs(ref);

    /** Basic function */
    const _toString = () => {
      return `${this._mongo}`;
    };

    /** Private function */
    const _getMongo = (ref) => {
      let mongo = null;
      if (ref instanceof Mongo) {
        mongo = ref;
      }
      if (ref instanceof DB) {
        mongo = ref._mongo;
      }
      if (ref instanceof DBCollection) {
        mongo = ref._mongo;
      }
      return mongo;
    };
    const _reload = () => {
      if (this._mongo) {
        this._mongo.getDBNames().forEach(_ => {
          this[_] = this._mongo.getDB(_);
        });
      }
    };
    const _has = (db) => {
      _reload();
      return Object.keys(this).indexOf(db) >= 0;
    };

    const _getNonExistDBHandler = (target, name) => {
      let value = target[name];
      if (target._mongo && !target.hasOwnProperty(name)) {
        value = target._mongo.getDB(name);
      }
      return value;
    };
    const _null = () => {
      return null;
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString: Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      tojson  : Object.extend({value: function (...p) { return _toString(...p) }}, _descriptor),
      reload  : Object.extend({value: function (...p) { return _reload(...p) }}, _descriptor),
      has     : Object.extend({value: function (...p) { return _has(...p) }}, _descriptor),
    });

    this._mongo = _getMongo(ref);
    _reload();
    const _handler = {
      get: _getNonExistDBHandler,
    };
    const _proxy = new Proxy(this, _handler);
    _descriptor.enumerable = false;
    Object.defineProperties(_proxy, {[Symbol.toPrimitive]: Object.extend({value: _null}, _descriptor)});
    return _proxy;
  };
  const __$DBs__ = $DBs.prototype = {
    help: function () {
      return `\
[$DBs](ref) - father object that contain all databases as its property
  .reload() - map existing databases as property
  .has(db) - check if db exists
`;
    },
  };

  /** Define deploy object */
  const _id = `$DBs`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $DBs = ${tojson($DBs)};
  $DBs.prototype = ${tojson(__$DBs__)};
  $DBs.toString = $DBs.tojson = function () {return this.prototype.help()};
  $DBs.prototype.toString = $DBs.prototype.tojson = function () { return this.help(); }

  $Object.deepFreeze($DBs);
  return $DBs;
})()`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}