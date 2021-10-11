{
  const $BetLog = function (source, destination) {
    /** Self construct */
    if (!(this instanceof $BetLog)) return new $BetLog(...arguments);

    /** Logger */
    const logger = $Log(`BETLOG`);

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
      return `[$BetLog]`;
    };
    const _valueOf = () => {
      return ``;
    };

    /** Private function */
    const _cookBetLog = (data) => {
      const cooked      = { updateOne: {} };
      const requestTS   = $ExtDate(data.requestTimeStamp);
      const responseTS  = $ExtDate(data.responseTimeStamp);
      const logTS       = $ExtDate(data.logTimeStamp);

      cooked.updateOne.filter = { _id: data._id };
      cooked.updateOne.update = { $set: {
        ts      : requestTS.toDate(),
        time    : {
          request   : requestTS.toString(),
          response  : data.responseTimeStamp == null ? null : responseTS - requestTS,
          log       : data.logTimeStamp == null ? null : logTS - requestTS,
        },
        data    : {
          siteId    : data.call?.siteId,
          memberId  : data.call?.obCustId,
          currency  : data.call?.currency,
          gameType  : data.call?.gameTypeId,
          roundId   : data.call?.gameRoundId,
          choiceId  : data.call?.choiceId,
          amount    : Number(data.call?.amount),
          balance   : Number(data.result?.balance),
        },
        system  : data.system || 1,
      } };
      cooked.updateOne.upsert = true;

      return cooked;
    };
    const _projectBetLog = () => {
      return {
        _id                 : 1,
        requestTimeStamp    : 1,
        responseTimeStamp   : 1,
        logTimeStamp        : 1,
        'call.siteId'       : 1,
        'call.obCustId'     : 1,
        'call.currency'     : 1,
        'call.gameTypeId'   : 1,
        'call.gameRoundId'  : 1,
        'call.choiceId'     : 1,
        'call.amount'       : 1,
        'result.balance'    : 1,
        system              : 1,
      }
    };
    const _markBetLogDone = (betlog, _ids, flag) => {
      const title = `Mark Done ${betlog.getName()}`;

      const res = betlog.updateMany({_id: {$in: _ids}}, {$set: {'__archive.betlogs': flag}});
      logger.info(title, `Updated ${res.modifiedCount} / ${res.matchedCount} logs`);
    };
    const _to_id = (_) => {
      return _ ? _.updateOne.filter._id : null;
    };
    const _reduceWriteErrors = (acc, cur) => {
      acc[cur.code] = (acc[cur.code] || 0) + 1;
      return acc;
    };
    const _handleError = (title, err) => {
      if (err.name == "MongoBulkWriteError") {
        err.writeErrors.reduce(_reduceWriteErrors, []).forEach((val, idx) => {
          logger.err(title, `• [E${idx}] ${val} ops`);
        });
        logger.warn(title, `D-${err.deletedCount} • I-${err.insertedCount + err.upsertedCount} • M-${err.matchedCount} • U-${err.modifiedCount}`);
      } else {
        logger.err(title, err);
      }
    };
    const _filterOutInvalidData = (obj) => {
      const doc = obj.updateOne.update.$set.data;
      return doc.memberId || doc.amount || doc.balance;
    };
    const _processBetLog = (limit, flag) => {
      const title   = `Process   ${source.getName()}`;
      const _limit  = Number(limit) || 1000;
      const _flag   = Number(flag) || 1;

      const data = source.find(
        {'__archive.betlogs': {$ne: _flag}},
        _projectBetLog(),
        {limit: _limit},
      ).map(_cookBetLog).toArray();
      if (!data.length) return data.length;

      try {
        const _data = data.filter(_filterOutInvalidData);
        if (_data.length) {
          const res = destination.bulkWrite(_data, {ordered: false});
          logger.info(title, `D-${res.deletedCount} • I-${res.insertedCount + res.upsertedCount} • M-${res.matchedCount} • U-${res.modifiedCount}`);
        } else {
          logger.warn(title, `No valid data in this batch`);
        }
      } catch (e) {
        _handleError(title, e);
      }

      _markBetLogDone(source, data.map(_to_id).filter(Boolean), _flag);
      return data.length;
    };
    const _processAll = (limit, flag) => {
      while (_processBetLog(limit, flag) >= limit) {};
    };

    const _descriptor = {
      writable: false,
      enumerable: true,
    };
    Object.defineProperties(this, {
      [util.inspect.custom] : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      toString              : Object.assign({value: function () { return _toString  (...arguments) }}, _descriptor),
      processAll            : Object.assign({value: function () { return _processAll(...arguments) }}, _descriptor),
    });

    Object.deepFreeze(this);
    return this;
  };
  const $BetLogExt = function () {
    return {
      is$BetLog: function () {
        return $Schema($BetLog).test(...arguments);
      },
    };
  };
  const __$BetLog__ = function () {
    return {
      help: function () {
        return `\
[$BetLog](source, destination) - Object helper for processing bets log in {source} collection and save result to {destination} collection
  .processAll(limit, flag) - Process {limit} items in bets log with {flag} value
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$BetLog`;
  const version = `2.0.2`;
  const changelog = {
    '2.0.2': [
      `[${_id}] Change stoping criteria`,
      `[${_id}] Perfomance tuning - Remove unnecessary sort`,
    ],
    '2.0.1': [
      `[${_id}] Handle null data`,
    ],
    '2.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $BetLog = Object.assign(${$BetLog}, (${$BetLogExt})());
  $BetLog.prototype = (${__$BetLog__})();
  $BetLog.toString = $BetLog[util.inspect.custom] = function () {return this.prototype.help()};
  $BetLog.prototype.toString = $BetLog.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($BetLog);
  global.$BetLog = $BetLog;
}`);

  /** Deploy */
  $Deploy(`BIZ`).run(_id, version, changelog, value);
}
