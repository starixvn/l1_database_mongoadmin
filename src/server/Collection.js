{
  const $Collection = function (coll, options) {
    /** Self construct */
    if (!(this instanceof $Collection)) return new $Collection(...arguments);

    /** Private constant */
    const logger = $Log(`COLL`);

    const infoSchema = $Schema({
      '!name'   : "Collection",
      'type'    : "string",
      '!options': {
        'capped'    : "boolean",
        'size'      : ["number", Long],
        'max'       : "number",
        'collation' : $Collation,
        'validator' : "object",
      },
      'info'    : {
        'readOnly'  : "boolean",
        'uuid'      : UUID,
      },
      'idIndex' : $Index,
    });

    /** Private variable */
    let infoObj     = null;
    let srvInfoObj  = null;

    /** Basic function */
    const _toString = () => {
      return `[$Collection]`;
    };
    const _valueOf = () => {
      return ``;
    };

    /** Private function */
    const _parseCollectionInfo = (obj) => {
      if (!infoSchema.test(obj)) {
        logger.err(` Audit    `, `Invalid input data for info object`);
        return null;
      }
      return obj;
    };
    const _mapHelper = (obj) => {
      if (!obj) return null;
      if (obj.options.collation) {
        obj.options.collation = $Collation(obj.options.collation);
      }
      if (obj.idIndex) {
        obj.idIndex = $Index(obj.idIndex);
      }
      return obj;
    }
    const _genData = () => {
      if ($Collection.is$Collection(coll)) {
        infoObj = _parseCollectionInfo(coll.getRaw());
        return;
      }
      if (infoSchema.test(coll)) {
        infoObj = _parseCollectionInfo(coll);
        return;
      }
      let data = {};
      const isColl = $Schema("Collection");
      if ((!isColl.test(coll)) && isColl.test(coll.name)) {
        data = coll;
      } else {
        data = {
          name    : coll,
          options : {...options},
        }
      }
      data = _mapHelper(data);
      infoObj = _parseCollectionInfo(data);
    }
    const _getRaw = () => {
      return infoObj;
    };
    const _loadServerCollectionInfo = () => {
      if (!infoObj) return;
      const srvInfo = _mapHelper(infoObj.name.exists());
      if (!srvInfo) return;
      srvInfo.name = infoObj.name;
      srvInfoObj = _parseCollectionInfo(srvInfo);
    }
    const _create = () => {
      const title = ` Create    `;
      _loadServerCollectionInfo();
      if (srvInfoObj) return;
      const options = { ...infoObj.options };
      if (options.collation) {
        options.collation = options.collation.getSimple();
      }
      infoObj.name.getDB().createCollection(infoObj.name.getName(), options);
      logger.info(title, `Collection ${util.inspect(infoObj.name)} created`);
    }
    const _validateMeta = (title) => {
      if (srvInfoObj.type != "collection") {
        logger.warn(title, `Metadata of ${util.inspect(infoObj.name)} MISMATCHED:`);
        logger.warn(title, `  - Need: "collection"`);
        logger.warn(title, `  - Have: "${srvInfoObj.type}"`);
      }
    };
    const _validateCapped = (title) => {
      const capped = {
        need: EJSON.stringify({
          capped: infoObj.options.capped,
          size  : infoObj.options.size,
          max   : infoObj.options.max,
        }),
        have: EJSON.stringify({
          capped: srvInfoObj.options.capped,
          size  : srvInfoObj.options.size,
          max   : srvInfoObj.options.max,
        }),
      };
      if (capped.need != capped.have) {
        logger.warn(title, `Capped options of ${util.inspect(infoObj.name)} MISMATCHED:`);
        logger.warn(title, `  - Need: ${capped.need}`);
        logger.warn(title, `  - Have: ${capped.have}`);
      }
    };
    const _validateCollate = (title) => {
      const collate = {
        need: $Collation(   infoObj.options.collation).valueOf(),
        have: $Collation(srvInfoObj.options.collation).valueOf(),
      };
      if (collate.need != collate.have) {
        logger.warn(title, `Collation of ${util.inspect(infoObj.name)} MISMATCHED:`);
        logger.warn(title, `  - Need: ${collate.need}`);
        logger.warn(title, `  - Have: ${collate.have}`);
        return;
      }
    };
    const _validate = () => {
      const title = ` Validate  `;
      _loadServerCollectionInfo();
      if (!srvInfoObj) {
        logger.err(title, `Collection ${util.inspect(infoObj.name)} does not exist on server`);
        return;
      }
      _validateMeta   (title);
      _validateCollate(title);
      _validateCapped (title);
    }

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString(...arguments) }}, _descriptor),
      create                : Object.assign({value: function () { return _create  (...arguments) }}, _descriptor),
      getRaw                : Object.assign({value: function () { return _getRaw  (...arguments) }}, _descriptor),
      validate              : Object.assign({value: function () { return _validate(...arguments) }}, _descriptor),
    });

    _genData();
    if (!infoObj) return null;

    Object.deepFreeze(this);
    return this;
  };
  const $CollectionExt = function () {
    return {
      is$Collection: function () {
        return $Schema($Collection).test(...arguments);
      },
    };
  };
  const __$Collection__ = function () {
    return {
      help: function () {
        return `\
[$Collection](coll, options) - Object helper for managing collection options
  .create()   - Create collection with provided options
  .getRaw()   - Get the raw information object
  .valdiate() - Validate server collection options with provided ones
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Collection`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Collection = Object.assign(${$Collection}, (${$CollectionExt})());
  $Collection.prototype = (${__$Collection__})();
  $Collection.toString = $Collection[util.inspect.custom] = function () {return this.prototype.help()};
  $Collection.prototype.toString = $Collection.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Collection);
  global.$Collection = $Collection;
}`);

  /** Deploy */
  $Deploy(`SRV`).run(_id, version, changelog, value);
}
