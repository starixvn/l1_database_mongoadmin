{
  const $ArchiveTime = function (from, to, options, childOptions) {
    /** Self construct */
    if (!(this instanceof $ArchiveTime)) return new $ArchiveTime(...arguments);

    const logger = $Log(`ARCHIVE-TIME`);
    if (from?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[from] must be a Mongo collection`);
      return null;
    }
    if (to?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[to] must be a Mongo collection`);
      return null;
    }

    /** Private constant */
    const arcOptsSchema = $Schema({
      '!timeField'  : "string",
      '!cutOffTime' : Date,
      '!updateOnly' : "boolean",
      '!filter'     : "object",
      'logField'    : "string",
      'logValue'    : "string",
    });

    const childOptsSchema = $Schema({
      '!fromColl'   : "Collection",
      '!toColl'     : "Collection",
      '!joinParent' : "string",
      '!joinChild'  : "string",
      '!updateOnly' : "boolean",
      '!filter'     : "object",
      'logField'    : "string",
      'logValue'    : "string",
    });

    const arcOpts = Object.assign({cutOffTime: ISODate(), filter: {}, updateOnly: false}, options);
    const childOpts = Object.assign([], childOptions);

    if (!arcOptsSchema.test(arcOpts)) {
      logger.err(`Audit`, `Incorrect archive options`);
      return null;
    }
    if (childOpts.length && !childOptsSchema.test(childOpts)) {
      logger.err(`Audit`, `Incorrect child's archive options`);
      return null;
    }

    /** Ids object
     *  • The list of data
     */
    let ids = {};

    /** Insert pipe
     *  • The list of operation that will insert the documents into destination colection
     */
    let insPipe = [];

    /** Update pipe
     *  • The list of operation that will update the flags of copied documents
     *    in source collection
     */
    let updPipe = [];

    /** Basic function */
    const _toString = () => {
      return `[$ArchiveTime]`;
    };
    const _valueOf = () => {
      return ``;
    };

    /** Private function */
    const _reduceIdsObject = (accumulator, current) => {
      /** Ids object
       *  • Each child archive process may have its own joining strategy
       *  • This object will collect all values that needed for joining
       *    to pass into child archive process
       */
      accumulator[current.joinParent] = [];
      return accumulator;
    };
    const _buildIds = (options) => {
      /** Build ids
       *  
       */
      ids = options.reduce(_reduceIdsObject, {});
    };
    const _buildFilter = (options) => {
      /** Building filter
       *  • Check if the archive flag exists
       *  • Only archive data EARLIER than cut off time based on config field
       */
      const filter = Object.assign({'__archive.eventtime': {$exists: false}}, options.filter);
      if (options.timeField) {
        filter[options.timeField] = {$lt: options.cutOffTime};
      }
      return filter;
    };
    const _reduceWriteError = (accumulator, current) => {
      accumulator[current.code] = (accumulator[current.code] ?? 0) + 1;
      return accumulator;
    };
    const _handleBulkWriteError = (err, msg) => {
      /** BulkWriteError
       *  • This function will be used for catching the BulkWriteError
       *  • In some cases, insert documents can failed be cause the document are already
       *    archived. Since this error can be ignored, we will only print the count of
       *    failed documents and continue the process.
       */
      if (err?.constructor?.name == "MongoBulkWriteError") {
        const errList = err.writeErrors.reduce(_reduceWriteError, {});
        for (const code in errList) {
          logger.err(from._name, `- ${msg}: E${code} - ${errList[code]} ops`);
        }
      } else {
        logger.err(from._name, `- ${msg}: ${err.code} - ${err.errmsg}`);
      }
    };
    const _getTimeField = (doc, options) => {
      return options.timeField ? doc[options.timeField] : options.cutOffTime;
    };
    const _processInsertPipe = (doc) => {
      insPipe.push({insertOne: {
        document: doc,
      }});
    };
    const _processUpdatePipe = (doc, options) => {
      updPipe.push({updateOne: {
        filter: {_id: doc._id},
        update: [
          {$set: {'__archive.eventtime': _getTimeField(doc, options)}},
        ],
      }});
    };
    const _addDataIds = (doc, options) => {
      for (const field in ids) {
        ids[field].push({
          joinVal : doc[field],
          time    : _getTimeField(doc, options),
        });
      }
    };
    const _updateArchiveStatuses = (options) => {
      /** Update archive_statuses
       *  • Only execute when related options are set
       *  • Get latest archived data and update status with configured field
       */
      if (!options.logField || !options.logValue) return;

      /** Get status value from destination collection */
      const projection = {
        _id               : 0,
        [options.logValue]: 1,
      };
      const sort = {
        [options.logValue]: -1,
      };
      const defaultValue = {
        [options.logValue]: null,
      };
      const statusValue = to.find({}, projection).sort(sort).limit(1).toArray()[0];

      /** Update status value to archive_statuses */
      const name = from._name.replace(options.logField, '');
      const set = {
        [`lastArcId.${options.logField}`] : Number((statusValue || defaultValue)[options.logValue]),
      };
      from._db.archive_statuses.updateOne(
        {name},
        {$set: set},
        {upsert: true},
      );
    };
    const _executeChildArchive = (options) => {
      const childDataOpts = ids[options.joinParent];
      const childArcOpts = {
        joinCol   : options.joinChild,
        updateOnly: !!options.updateOnly,
        filter    : Object.assign({}, options.filter),
        logField  : options.logField,
        logValue  : options.logValue,
      };
      $ArchiveId(options.fromColl, options.toColl, childDataOpts, childArcOpts).runArchive();
    };
    const _executeServerOperation = (options, childOptions) => {
      /** Execute server operation
       *  • 
       */

      /** TODO: archive child collection */
      childOptions.forEach(_executeChildArchive);
      for (const field in ids) {
        ids[field] = [];
      }

      logger.info(from._name, `- Archiving ${insPipe.length} documents.`);

      /** Processing insert pipe
       *  • Insert documents to destination collection
       *  • Only execute when updateOnly flag is false
       */
      if (!options.updateOnly) {
        try {
          to.bulkWrite(insPipe, {ordered: false});
        } catch (e) {
          _handleBulkWriteError(e, `Insert to ${to._name}`);
        }
      }
      insPipe = [];

      /** Processing update pipe
       *  • Update documents in source collection to flag them as archived
      */
      try {
        from.bulkWrite(updPipe, {ordered: false})
      } catch(e) {
        _handleBulkWriteError(e, `Update to ${from._name}`);
      }
      updPipe = [];

      /** Processing archive_statuses
       *  • Update value to latest archived round id
       */
      _updateArchiveStatuses(options);
    };
    const _processData = (doc) => {
      /** Process data from source
       *  • Document will be fetched from server cursor
       *  • Each document will be processed according to archive config
       */

      /** Document will be inserted to destination as whole */
      _processInsertPipe(doc);

      /** Update archive flag on source document */
      _processUpdatePipe(doc, arcOpts);

      /** Add joining value into ids object */
      _addDataIds(doc, arcOpts);

      /** Execute server operation for each 1000 iterations */
      if ((insPipe.length - 1) % 1000 == 999) {
        _executeServerOperation(arcOpts, childOpts);
      }
    };
    const _runArchive = () => {
      /** Run archive by time process
       *  • 
       */

      logger.info(from._name, `CutOffTime: ${arcOpts.cutOffTime.toISOString()}`);

      /** Building ids object */
      _buildIds(childOpts);

      /** Get data from source collection and execute archive process */
      const filter = _buildFilter(arcOpts);
      from.find(filter).noCursorTimeout().forEach(_processData);
      if (insPipe.length + updPipe.length > 0) {
        _executeServerOperation(arcOpts, childOpts);
      }

      logger.info(from._name, `Finished.`);
    }

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      runArchive            : Object.assign({value: function () { return _runArchive(...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const $ArchiveTimeExt = function () {
    return {};
  };
  const __$ArchiveTime__ = function () {
    return {
      help: function () {
        return `\
[$ArchiveTime]
  .func()
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$ArchiveTime`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $ArchiveTime = Object.assign(${$ArchiveTime}, (${$ArchiveTimeExt})());
  $ArchiveTime.prototype = (${__$ArchiveTime__})();
  $ArchiveTime.toString = $ArchiveTime[util.inspect.custom] = function () {return this.prototype.help()};
  $ArchiveTime.prototype.toString = $ArchiveTime.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($ArchiveTime);
  global.$ArchiveTime = $ArchiveTime;
}`);

  /** Deploy */
  $Deploy(`TOOL`).run(_id, version, changelog, value);
}
