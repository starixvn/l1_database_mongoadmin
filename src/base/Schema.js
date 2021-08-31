{
  const $Schema = function (schema, verbose = false) {
    /** Self construct */
    if (!(this instanceof $Schema)) return new $Schema(...arguments);

    /** Private constant */
    const _logger = $Log(`SCHEMA`);
    const isVerbose = !!verbose;

    /** Private variable */
    let schObj = {};

    /** Basic function */
    const _toString = () => {
      return `[$Schema] - Object verifying with verbose is ${isVerbose}`;
    };

    /** Private function */
    const _parseSchemaObjectField = function (key) {
      const parsed = /^(!)?(.*)$/.exec(key);
      Object.assign(this.result, {
        [parsed[2]]: {
          mandatory: !!parsed[1],
          value: _parseSchemaObject(this.input[parsed[0]]),
        },
      });
    };
    const _parseSchemaObject = function (obj) {
      if (util.isArray(obj)) {
        return obj.map(_parseSchemaObject);
      }
      if (util.isObject(obj)) {
        const schObj = {};
        Object.keys(obj).forEach(_parseSchemaObjectField, {input: obj, result: schObj});
        return schObj;
      }
      return obj;
    };
    const _getSchemaObject = () => {
      return schObj;
    };
    const _reduceMaxLength = (accumulator, currentValue) => {
      return accumulator > currentValue.length ? accumulator : currentValue.length;
    };
    const _mapKeyObjectToString = function (key) {
      return `${key}: ${_getSchemaString(this.obj[key])}`;
    };
    const _getSchemaString = (sch) => {
      if (util.isArray(sch)) {
        return `[${sch.map($Object.typeof).join(', ')}]`;
      }
      if (util.isObject(sch)) {
        return `{${Object.keys(sch).map(_mapKeyObjectToString, {obj: sch}).join(', ')}}`;
      }
      if (util.isFunction(sch)) {
        return `class ${sch.name}`;
      }
      return JSON.stringify(sch);
    };
    const _verbostTestField = (key, thisObj) => {
      const obj = thisObj.obj || {};
      const keyLen = [...Object.keys(thisObj.sch), ...Object.keys(obj)].reduce(_reduceMaxLength, 0);
      if (isVerbose) {
        const mandatory = thisObj.sch[key].mandatory ? '!' : ' ';
        let schema = _getSchemaString(thisObj.sch[key].value);
        _logger.verbose(`Test ${key.pad(keyLen, 1)}`, `[${mandatory}] - ${schema}`);
        _logger.verbose(`Test ${key.pad(keyLen, 1)}`, `      » ${JSON.stringify(obj[key])}`);
      }
    };
    const _testFieldSchemaArray = function (sch) {
      const result = {value: 1};
      let customSch = {
        [this.key]: {
          mandatory: this.sch[this.key].mandatory,
          value: sch,
        },
      };
      _testField.bind({obj: this.obj, sch: customSch, result: result})(this.key);
      return !!result.value;
    };
    const _testField = function (key) {
      /** [NG] No need to check if failed */
      if (!this.result.value) return this.result.value;

      /** Print verbose info */
      _verbostTestField(key, this);

      /** [NG] Cannot test null object */
      if (util.isNullOrUndefined(this.obj)) {
        return this.result.value &= 0;
      }

      /** If tested object is an Array, combine result of every items */
      if (util.isArray(this.obj[key])) {
        return this.result.value &= this.obj[key].every(item => _testSchema({[key]: item}, {[key]: this.sch[key]}));
      }

      /** [OK] Value can be null if the field is not mandatory */
      if ((!this.sch[key].mandatory) && util.isNullOrUndefined(this.obj[key])) {
        return this.result.value &= 1;
      }
      /** [OK] Matched defined type */
      if (util.isString(this.sch[key].value) && (typeof this.obj[key] == this.sch[key].value)) {
        return this.result.value &= 1;
      }
      /** [OK] Matched defined class */
      if (util.isFunction(this.sch[key].value) && (this.obj[key] instanceof this.sch[key].value)) {
        return this.result.value &= 1;
      }
      /** If defined schema is array, only need one OK */
      if (util.isArray(this.sch[key].value)) {
        return this.result.value &= this.sch[key].value.some(_testFieldSchemaArray, {obj: this.obj, sch: this.sch, key: key});
      }
      /** If defined schema is object, need nested check */
      if (util.isObject(this.sch[key].value)) {
        return this.result.value &= _testSchema(this.obj[key], this.sch[key].value);
      }
      return this.result.value &= 0;
    };
    const _testSchema = (obj, sch) => {
      const result = {value: 1};

      /** Test every defined fields in schema */
      Object.keys(sch).forEach(_testField, {obj: obj, sch: sch, result: result});

      return !!result.value;
    };
    const _test = (obj) => {
      if ((!util.isObject(obj)) && (!util.isFunction(obj))) return false;
      return _testSchema(obj, schObj);
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      toString        : Object.assign({value: function () { return _toString        (...arguments) }}, _descriptor),
      tojson          : Object.assign({value: function () { return _toString        (...arguments) }}, _descriptor),
      getSchemaObject : Object.assign({value: function () { return _getSchemaObject (...arguments) }}, _descriptor),
      test            : Object.assign({value: function () { return _test            (...arguments) }}, _descriptor),
    });

    schObj = _parseSchemaObject(schema);
    Object.deepFreeze(this);
    return this;
  };
  const $SchemaExt = function () {
    return {};
  };
  const __$Schema__ = function () {
    return {
      help: function () {
        return `\
[$Schema](schema, verbose) - object type verification
  .getSchemaObject()  - return schema object
  .test(obj)          - check if the obj satisfy the schema
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Schema`;
  const version = `0.2.0`;
  const changelog = {
    '0.2.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const $Schema = Object.assign(${$Schema}, (${$SchemaExt})());
  $Schema.prototype = (${__$Schema__})();
  $Schema.toString = $Schema.tojson = function () {return this.prototype.help()};
  $Schema.prototype.toString = $Schema.prototype.tojson = function () { return this.help(); }

  Object.deepFreeze($Schema);
  return $Schema;
})()`);

  /** Deploy */
  $Deploy(`BASE`).run(_id, version, changelog, value);
}
