{
  const $ArchiveId = function (from, to, dataOptions, archiveOptions) {
    /** Self construct */
    if (!(this instanceof $ArchiveId)) return new $ArchiveId(...arguments);

    const logger = $Log(`ARC-ID  `);
    if (from?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[from] must be a Mongo collection`);
      return null;
    }
    if (to?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[to] must be a Mongo collection`);
      return null;
    }

    /** Private constant */
    const dataValueSchema = $Schema({
      '!joinVal'    : "",
      '!time'       : Date,
    });

    const arcOptsSchema = $Schema({
      '!joinCol'    : "string",
      '!updateOnly' : "boolean",
      '!filter'     : "object",
      'logField'    : "string",
      'logValue'    : "string",
    });

    const dataOpts = Object.assign([], dataOptions);
    const arcOpts = Object.assign({updateOnly: false, filter: {}}, archiveOptions);

    if (dataOpts.length && !dataValueSchema.test(dataOpts)) {
      logger.err(`Audit`, `Incorrect data archive options`);
      return null;
    }
    if (!arcOptsSchema.test(arcOpts)) {
      logger.err(`Audit`, `Incorrect archive options`);
      return null;
    }

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
      return `[$ArchiveId]`;
    };
    const _valueOf = () => {
      return ``;
    };

    /** Private function */
    const _mapDataValue = (data) => {
      return data.joinVal;
    };
    const _buildFilter = (options, dataOptions) => {
      /** Building filter
       *  • Check if the archive flag exists
       *  • Only archive data EARLIER than cut off time based on config field
       */
      const filter = Object.assign(
        {'__archive.eventtime': {$exists: false}},
        options.filter,
        {[options.joinCol]: {$in: dataOptions.map(_mapDataValue).filter(Boolean)}},
      );
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
          logger.err(from.getName(), `- ${msg}: E${code} - ${errList[code]} ops`);
        }
      } else {
        logger.err(from.getName(), `- ${msg}: ${err.code} - ${err.errmsg}`);
      }
    };
    const _processInsertPipe = (doc) => {
      insPipe.push({insertOne: {
        document: doc,
      }});
    };
    const _processUpdatePipe = (options, dataOptions) => {
      dataOptions.forEach(data => {
        updPipe.push({updateMany: {
          filter: {
            '__archive.eventtime' : {$exists: false},
            [options.joinCol]     : data.joinVal,
          },
          update: [
            {$set: {'__archive.eventtime': data.time}},
          ],
        }});
      });
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
      const name = from.getName().replace(options.logField, '');
      const set = {
        [`lastArcId.${options.logField}`] : Number((statusValue || defaultValue)[options.logValue]),
      };
      from.getDB().archive_statuses.updateOne(
        {name},
        {$set: set},
        {upsert: true},
      );
    };
    const _executeInsertOperation = (options) => {
      /** Execute insert operation
       *  • 
       */

      logger.info(from.getName(), `- Archiving ${insPipe.length} documents.`);

      /** Processing insert pipe
       *  • Insert documents to destination collection
       *  • Only execute when updateOnly flag is false
       */
      if (!options.updateOnly) {
        try {
          to.bulkWrite(insPipe, {ordered: false});
        } catch (e) {
          _handleBulkWriteError(e, `Insert to ${to.getName()}`);
        }
      }
      insPipe = [];

      /** Processing archive_statuses
       *  • Update value to latest archived round id
       */
      _updateArchiveStatuses(options);
    };
    const _executeUpdateOperation = () => {
      /** Execute update operation
       *  • 
       */

      /** Processing update pipe
       *  • Update documents in source collection to flag them as archived
      */
      try {
        from.bulkWrite(updPipe, {ordered: false})
      } catch(e) {
        _handleBulkWriteError(e, `Update to ${from.getName()}`);
      }
      updPipe = [];
    };
    const _processData = (doc) => {
      /** Process data from source
       *  • Document will be fetched from server cursor
       *  • Each document will be processed according to archive config
       */

      /** Document will be inserted to destination as whole */
      _processInsertPipe(doc);

      /** Execute server operation for each 1000 iterations */
      if ((insPipe.length - 1) % 1000 == 999) {
        _executeInsertOperation(arcOpts);
      }
    };
    const _runArchive = () => {
      /** Run archive by id process
       *  • 
       */

      /** Update archive flag on source document */
      _processUpdatePipe(arcOpts, dataOpts);

      /** Get data from source collection and execute archive process */
      if (!arcOpts.updateOnly) {
        const filter = _buildFilter(arcOpts, dataOpts);
        from.find(filter).noCursorTimeout().forEach(_processData);

        if (insPipe.length > 0) {
          _executeInsertOperation(arcOpts);
        }
      }

      _executeUpdateOperation();
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
  const $ArchiveIdExt = function () {
    return {};
  };
  const __$ArchiveId__ = function () {
    return {
      help: function () {
        return `\
[$ArchiveId](from, to, dataOptions, archiveOptions) - Object helper for archiving data from {from} to {to} collection
  .runArchive() - Run archive based on input configs
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$ArchiveId`;
  const version = `2.0.1`;
  const changelog = {
    '2.0.1': [
      `[${_id}] Remove usage of internal field, using supported methods instead`,
    ],
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $ArchiveId = Object.assign(${$ArchiveId}, (${$ArchiveIdExt})());
  $ArchiveId.prototype = (${__$ArchiveId__})();
  $ArchiveId.toString = $ArchiveId[util.inspect.custom] = function () {return this.prototype.help()};
  $ArchiveId.prototype.toString = $ArchiveId.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($ArchiveId);
  global.$ArchiveId = $ArchiveId;
}`);

  /** Deploy */
  $Deploy(`TOOL`).run(_id, version, changelog, value);
}
