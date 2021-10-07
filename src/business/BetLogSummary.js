{
  const $BetLogSummary = function (source, destination) {
    /** Self construct */
    if (!(this instanceof $BetLogSummary)) return new $BetLogSummary(...arguments);

    /** Logger */
    const logger = $Log(`BETLOGSUM`);

    /** Audit */
    if (source?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[source] must be a MongoDB collection`);
      return;
    }
    if (destination?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[destination] must be a MongoDB collection`);
      return;
    }

    /** Basic function */
    const _toString = () => {
      return `[$BetLogSummary]`;
    };
    const _valueOf = () => {
      return ``;
    };

    /** Private function */
    const _getRoundDuration = (round) => {
      let roundDuration = 1000;

      if (String(round).toLowerCase() == 'day') {
        roundDuration = 24 * 3600 * 1000;
      };
      if (String(round).toLowerCase() == 'hour') {
        roundDuration = 3600 * 1000;
      };

      return roundDuration;
    };
    const _getTime = (time, round) => {
      let _time = Date.now();
      const _roundDuration = _getRoundDuration(round);

      if (time instanceof Date) {
        _time = time.valueOf();
      };
      if (typeof time == "number") {
        _time = time;
      }
      else {
        _time = Date.parse(time);
      };

      return _time ? new Date(Math.floor(_time / _roundDuration) * _roundDuration) : null;
    };
    const _getTimeStr = (time, round) => {
      const _time = _getTime(time, round);
      if (String(round).toLowerCase() == 'day') {
        return _time.toISOString().substr(0,10);
      };
      if (String(round).toLowerCase() == 'hour') {
        return `${_time.toISOString().substr(0,10)} ${_time.toISOString().substr(11,8)}`;
      };
    };
    const _buildSummaryAgg = (time, round) => {
      const _roundDuration = _getRoundDuration(round);
      const _from = _getTime(time, round);
      const _to = _getTime(_from.valueOf() + _roundDuration, round);
      const agg = [];

      agg.push({$match: {$and: [
        {ts: {$gte: _from}},
        {ts: {$lt: _to}},
      ]}});
      agg.push({$project: {_id: 0, data: 1, system: 1}});
      agg.push({$group: {
        _id: {
          gameId  : `$data.gameType`,
          currency: `$data.currency`,
          siteId  : `$data.siteId`,
          memberId: `$data.memberId`,
          roundId : `$data.roundId`,
          system  : `$system`,
        },
        requestCount: {$sum: 1},
        totalAmount: {$sum: `$data.amount`}
      }});
      agg.push({$group: {
        _id: {
          gameId  : `$_id.gameId`,
          currency: `$_id.currency`,
          system  : `$_id.system`,
        },
        betCount    : {$sum: 1},
        requestCount: {$sum: `$requestCount`},
        totalAmount : {$sum: `$totalAmount`},
      }});
      agg.push({$project: {
        _id: 0,
        'key.time': {$literal: _from}, 'key.gameId': `$_id.gameId`, 'key.currency': `$_id.currency`, 'key.system': `$_id.system`,
        'value.betCount': `$betCount`, 'value.requestCount': `$requestCount`, 'value.totalAmount': `$totalAmount`,
      }});

      return agg;
    };
    const _toSortedObjectJson = (obj) => {
      return EJSON.stringify(Object.sort(obj));
    };
    const _getOldSummary = (time, round) => {
      const _time = _getTime(time, round);
      return destination.find(
        {time: _time},
        {_id: 0, time: 1, gameId: 1, currency: 1, system: 1},
      ).map(_toSortedObjectJson).toArray();
    };
    const _parseSystem = (value) => {
      switch (value) {
        case 1:
          return `Cocos`;
        case 2:
          return `Mobi`;
        default:
          return `null`;
      }
    }
    const _processSummaryData = function (doc) {
      const res = destination.updateOne(doc.key, {$set: doc.value}, {upsert: true});
      if (res.upsertedCount > 0) {
        logger.info(`From ${source.getName()}`, `- Inserted new summary record for G${doc.key.gameId} ${doc.key.currency} ${_parseSystem(doc.key.system)}`);
      } else if (res.modifiedCount > 0) {
        logger.info(`From ${source.getName()}`, `- Modified summary record for G${doc.key.gameId} ${doc.key.currency} ${_parseSystem(doc.key.system)}`);
      }

      const idx = this.oldSums.indexOf(_toSortedObjectJson(doc.key));
      if (idx >= 0) {
        this.oldSums.splice(idx, 1);
      }
    };
    const _processOldSummaryData = function (doc) {
      try {
        const _doc = Object.assign({gameId: null, currency: null, system: null}, EJSON.parse(doc));
        const res = destination.deleteOne(_doc);
        if (res.deletedCount > 0) {
          logger.warn(`From ${source.getName()}`, `- Deleted summary record for G${_doc.gameId} ${_doc.currency} ${_parseSystem(_doc.system)}`);
        } else {
          logger.info(`From ${source.getName()}`, `- No summary record deleted for G${_doc.gameId} ${_doc.currency} ${_parseSystem(_doc.system)}`);
        }
      } catch (e) {
        logger.err(`From ${source.getName()}`, `- Something is WRONG while deleting summary record for ${util.inspect(doc)}`);
        logger.err(`From ${source.getName()}`, `    ${util.inspect(e)}`);
      }
    };
    const _runSummary = (time) => {
      const _round = `hour`;
      const _time = _getTime(time || (Date.now() - _getRoundDuration(_round)), _round);
      const timer = $Timer();

      const agg = _buildSummaryAgg(_time, _round);
      const oldSums = _getOldSummary(_time, _round);
      const summaries = source.aggregate(agg).toArray();

      if (summaries.length > 0) {
        logger.info(`From ${source.getName()}`, `Summary for ${_getTimeStr(_time, _round)} started`);
      }
      summaries.forEach(_processSummaryData, {oldSums: oldSums});

      oldSums.forEach(_processOldSummaryData);
      if (summaries.length > 0) {
        logger.info(`From ${source.getName()}`, `Done summarize data for ${_getTimeStr(_time, _round)} in ${timer.getTimerDuration()} ms`);
      }
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      runSummary            : Object.assign({value: function () { return _runSummary(...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const $BetLogSummaryExt = function () {
    return {
      is$BetLogSummary: function () {
        return $Schema($BetLogSummary).test(...arguments);
      },
    };
  };
  const __$BetLogSummary__ = function () {
    return {
      help: function () {
        return `\
[$BetLogSummary](source, destination) - Object helper for summary processed bets log in {source} collection and save result in {destination} collection
  .runSummary(time) - Run summary for the hour that contains {time}
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$BetLogSummary`;
  const version = `2.0.1`;
  const changelog = {
    '2.0.1': [
      `[${_id}] Using ts field for better time support than time.request string field`,
    ],
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $BetLogSummary = Object.assign(${$BetLogSummary}, (${$BetLogSummaryExt})());
  $BetLogSummary.prototype = (${__$BetLogSummary__})();
  $BetLogSummary.toString = $BetLogSummary[util.inspect.custom] = function () {return this.prototype.help()};
  $BetLogSummary.prototype.toString = $BetLogSummary.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($BetLogSummary);
  global.$BetLogSummary = $BetLogSummary;
}`);

  /** Deploy */
  $Deploy(`BIZ`).run(_id, version, changelog, value);
}
