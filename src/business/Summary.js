{
  const $Summary = function (mongo, summary) {
    /** Self construct */
    if (!(this instanceof $Summary)) return new $Summary(...arguments);

    /** Logger */
    const logger = $Log(`SUMMARY`);

    /** DBs object */
    const dbs = DBs(mongo);
    if (!(dbs instanceof DBs)) {
      logger.err(`Audit`, `[mongo] must be a MongoDB reference`);
      return;
    }

    /** Summary DB */
    if (!(summary?.constructor?.name == "Database")) {
      logger.err(`Audit`, `[summary] must be a MongoDB database`);
      return;
    }

    /** Basic function */
    const _toString = () => {
      return `[$Summary]`;
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
    const _parseEpoch = (time) => {
      let _time = Date.now();
      if (time instanceof Date) {
        _time = time.valueOf();
      }
      if (typeof time == "number") {
        _time = time;
      } else {
        _time = Date.parse(time);
      }
      return _time;
    };
    const _getRoundedTime = (time, round) => {
      const _time = _parseEpoch(time);
      const _roundDuration = _getRoundDuration(round);
      return new Date(Math.floor(_time / _roundDuration) * _roundDuration);
    };
    const _getTimeStr = (time, round) => {
      const _time = _getRoundedTime(time, round);
      let _str = String(_time);
      if (String(round).toLowerCase() == 'day') {
        _str = _time.toISOString().substr(0,10);
      };
      if (String(round).toLowerCase() == 'hour') {
        _str = `${_time.toISOString().substr(0,10)} ${_time.toISOString().substr(11,8)}`;
      };
      return _str;
    };
    const _getSummaryColl = (round) => {
      let coll = `summaries`;

      if (String(round).toLowerCase() == 'day') {
        coll = `daily_summaries`;
      };
      if (String(round).toLowerCase() == 'hour') {
        coll = `hourly_summaries`;
      };

      return coll;
    };
    const _checkSummaryTime = (time, round) => {
      const _time = _getRoundedTime(time, round);
      if (!$Schema(Date).test(_time)) {
        logger.err(`Summary Time`, `[${time}] is not a valid time`);
        return false;
      }
      if (_getRoundedTime(time, round).valueOf() < _getRoundedTime(Date.now(), 'DAY').valueOf() - 7 * _getRoundDuration('DAY')) {
        logger.err(`Summary Time`, `[${_getTimeStr(time, round)}] is expired`);
        return false;
      }
      if (_getRoundedTime(time, round).valueOf() > _getRoundedTime(Date.now(), round).valueOf()) {
        logger.err(`Summary Time`, `[${_getTimeStr(time, round)}] is in the future`);
        return false;
      }
      if (_getRoundedTime(time, round).valueOf() == _getRoundedTime(Date.now(), round).valueOf()) {
        logger.warn(`Summary Time`, `[${_getTimeStr(time, round)}] is not finished`);
      }
      return true;
    };
    const _buildSummaryAgg = (time, round, conf) => {
      const _roundDuration = _getRoundDuration(round);
      const _from = _getRoundedTime(time, round);
      const _to = _getRoundedTime(_from.valueOf() + _roundDuration, round);
      const agg = [];

      agg.push({$match: {$and: [
        {[conf.fields.time.replace('$', '')]: {$gte: _from}},
        {[conf.fields.time.replace('$', '')]: {$lt: _to}},
      ]}});
      agg.push({$project: {_id: 0, [conf.fields.local]: 1}});
      agg.push({$lookup: {
        from: conf.coll.group + conf.coll.postfix,
        localField: conf.fields.local,
        foreignField: conf.fields.map,
        as: `bets`,
      }});
      agg.push({$unwind: `$bets`});
      agg.push({$replaceWith: `$bets`});
      agg.push({$match: {$and: [
        {[conf.fields.memberId]: {$gt: 0}},
        {$expr: {$gt: [{$toInt: conf.fields.settled}, 0]}},
      ]}});
      agg.push({$project: {
        _id: 0,
        stake: {$sum: conf.fields.stake},
        payout: {$sum: conf.fields.payout},
        '__archive.currency': 1,
        '__archive.isCash': 1,
      }});
      agg.push({$group: {
        _id: {
          currency: {$ifNull: [`$__archive.currency`, null]},
          isCash: {$ifNull: [`$__archive.isCash`, null]},
        },
        stake: {$sum: `$stake`},
        payout: {$sum: `$payout`},
        tickets: {$sum: 1},
      }});
      agg.push({$project: {
        _id: 0,
        'key.time': {$literal: _from}, 'key.gameId': {$literal: conf.gameId}, 'key.currency': `$_id.currency`, 'key.isCash': `$_id.isCash`,
        'value.stake': `$stake`, 'value.payout': `$payout`, 'value.tickets': `$tickets`,
      }});

      return agg;
    };
    const _getUidsOfNonexistingField = (conf, field) => {
      return dbs[conf.coll.db][`${conf.coll.group}${conf.coll.postfix}`].aggregate([
        {$match: {[`__archive.${field}`]: {$exists: false}, memberId: {$gt: 0}}},
        {$project: {_id: 0, uid: 1}},
        {$group: {_id: `$uid`}},
      ]).map(_ => _._id).toArray();
    };
    const _getUpdateNonexistingFieldPipe = (conf, field, uids) => {
      return dbs[conf.coll.db].userinfos.find(
        {id: {$in: uids}},
        {_id: 0, id: 1, [field]: 1},
      ).map(_ => {
        return { updateMany: {
          filter: {uid: _.id, [`__archive.${field}`]: {$exists: false}},
          update: [
            {$set: {[`__archive.${field}`]: {$literal: _[field]}}}
          ],
        }};
      }).toArray();
    };
    const _insertInternalField = (conf, field) => {
      const timer = $Timer();
      const uids = _getUidsOfNonexistingField(conf, field);
      const updPipe = _getUpdateNonexistingFieldPipe(conf, field, uids);

      if (!updPipe.length) return;
      const res = dbs[conf.coll.db][`${conf.coll.group}${conf.coll.postfix}`].bulkWrite(updPipe, {ordered: false});
      if (res.deletedCount + res.insertedCount + res.matchedCount + res.upsertedCount > 0) {
        logger.info(conf.name.en, `Added ${field} into [${conf.coll.group + conf.coll.postfix}] collection in ${timer.getTimerDuration()} ms.`);
        logger.info(conf.name.en, `  • D-${res.deletedCount} • I-${res.insertedCount} • M-${res.matchedCount} • U-${res.upsertedCount} •`);
      }
    };
    const _insertInternalData = (conf) => {
      if (conf.config.hasCurrency) return;

      const fields = [`currency`, `isCash`];
      fields.forEach(_ => _insertInternalField(conf, _));
    };
    const _toSortedObjectJson = (obj) => {
      return EJSON.stringify(Object.sort(obj));
    };
    const _getOldSummary = (time, round, conf) => {
      const coll = _getSummaryColl(round);
      return summary[coll].find(
        {time: time, gameId: conf.gameId},
        {_id: 0, time: 1, gameId: 1, currency: 1, isCash: 1},
      ).map(_toSortedObjectJson).toArray();
    };
    const _parseIsCash = (value) => {
      let result = `CRE`;
      if (value == null) {
        result = null;
      }
      if (value) {
        result = `DEP`;
      }
      return result;
    }
    const _processSummaryData = (doc, coll, conf, oldSums) => {
      const res = summary[coll].updateOne(doc.key, {$set: doc.value}, {upsert: true});
      if (res.insertedId) {
        logger.info(conf.name.en, `Inserted new summary record for ${doc.key.currency} ${_parseIsCash(doc.key.isCash)}`);
      }
      if (res.modifiedCount > 0) {
        logger.info(conf.name.en, `Modified summary record for ${doc.key.currency} ${_parseIsCash(doc.key.isCash)}`);
      }
      const idx = oldSums.indexOf(_toSortedObjectJson(Object.assign({currency: null, isCash: null}, doc.key)));
      if (idx >= 0) {
        oldSums.splice(idx, 1);
      }
    };
    const _processOldSummaryData = (doc, coll, conf) => {
      try {
        const _doc = Object.assign({currency: null, isCash: null}, EJSON.parse(doc));
        const res = summary[coll].deleteOne(_doc);
        if (res.deletedCount > 0) {
          logger.warn(conf.name.en, `Deleted summary record for ${_doc.currency} ${_parseIsCash(_doc.isCash)}`);
        } else {
          logger.info(conf.name.en, `No summary record deleted for ${_doc.currency} ${_parseIsCash(_doc.isCash)}`);
        }
      } catch (e) {
        logger.err(conf.name.en, `Something is WRONG while deleting summary record for ${doc}`);
      }
    };
    const _runConfSummary = (time, round, conf, force = false) => {
      const _time = _getRoundedTime(time, round);
      const timer = $Timer();
      const coll = _getSummaryColl(round);

      if (!force && !_checkSummaryTime(_time, round)) return;

      /** If tickets do not have currency field, insert currency for them */
      _insertInternalData(conf);

      const agg = _buildSummaryAgg(_time, round, conf);
      const oldSums = _getOldSummary(_time, round, conf);
      dbs[conf.coll.db][conf.coll.group + conf.coll.round].aggregate(agg).forEach(doc => _processSummaryData(doc, coll, conf, oldSums));

      oldSums.forEach(doc => _processOldSummaryData(doc, coll, conf));
      logger.info(conf.name.en, `Done summarize data in ${timer.getTimerDuration()} ms`);
    };
    const _runSummary = (time, round, force = false) => {
      const _time = _getRoundedTime(time || (Date.now() - _getRoundDuration(round)), round);
      logger.info(summary, `Summary for ${round[0].toUpperCase()}-${_getTimeStr(_time, round)} started.`);
      summary.game_summary_config.find().forEach(conf => _runConfSummary(_time, round, conf, force));
      logger.info(summary, `Data summary for ${round[0].toUpperCase()}-${_getTimeStr(_time, round)} finished.`);
    };
    const _runDailySummary = (time, force = false) => {
      return _runSummary(time, 'DAY', force);
    };
    const _runHourlySummary = (time, force = false) => {
      return _runSummary(time, 'HOUR', force);
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString        (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString        (...arguments) }}, _descriptor),
      runDailySummary       : Object.assign({value: function () { return _runDailySummary (...arguments) }}, _descriptor),
      runHourlySummary      : Object.assign({value: function () { return _runHourlySummary(...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const $SummaryExt = function () {
    return {};
  };
  const __$Summary__ = function () {
    return {
      help: function () {
        return `\
[$Summary](mongo, summary) - Object helper for summary data on {mongo} instance to {summary} database
  .runDailySummary(time)  - Run daily summary for the day that contains {time}
  .runHourlySummary(time) - Run hourly summary for the hour that contains {time}
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Summary`;
  const version = `2.0.2`;
  const changelog = {
    '2.0.2': [
      `[${_id}] Configurize [id], [memberId] fields`,
      `[${_id}] [settled] field can be non-boolean`,
      `[${_id}] Ensure [currency] existence in aggregate result`,
    ],
    '2.0.1': [
      `[${_id}] Add force option to bypass time audit`,
      `[${_id}] Using EJSON.stringify instead of JSON.stringify for BSON compatibility`,
      `[${_id}] Current round time summary will still be executed, it will raise warning instead of error`,
    ],
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Summary = Object.assign(${$Summary}, (${$SummaryExt})());
  $Summary.prototype = (${__$Summary__})();
  $Summary.toString = $Summary[util.inspect.custom] = function () {return this.prototype.help()};
  $Summary.prototype.toString = $Summary.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Summary);
  global.$Summary = $Summary;
}`);

  /** Deploy */
  $Deploy(`BIZ`).run(_id, version, changelog, value);
}
