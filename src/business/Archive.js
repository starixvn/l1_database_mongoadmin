{
  const $Archive = function (from, to, config) {
    /** Self construct */
    if (!(this instanceof $Archive)) return new $Archive(...arguments);

    /** Logger */
    const logger  = $Log(`ARCHIVE     `);

    /** DBs objects */
    const fromDBs = DBs(from);
    const toDBs   = DBs(to);

    /** Audting input */
    if (!(fromDBs instanceof DBs)) {
      logger.err(`Audit`, `[from] must be a Mongo reference`);
      return null;
    }
    if (!(toDBs instanceof DBs)) {
      logger.err(`Audit`, `[to] must be a Mong reference`);
      return null;
    }
    if (config?.constructor?.name != "Collection") {
      logger.err(`Audit`, `[config] must be a Mongo collection`);
      return null;
    }

    /** Schema of config document */
    const configSchema = $Schema({
      '!from'   : { '!db': "string", '!coll': "string" },
      '!to'     : { '!db': "string", '!coll': "string" },
      '!config' : {
        '!timeField'    : "string",
        'cutOffsetHours': "number",
        'join'          : "string",
        'filter'        : "object",
        'logField'      : "string",
        'logValue'      : "string",
      },
      'childs'  : {
        '!from'         : "string",
        '!to'           : "string",
        '!join'         : "string",
        'updateOnly'    : "boolean",
        'filter'        : "object",
        'logField'      : "string",
        'logValue'      : "string",
      },
    });

    /** Basic function */
    const _toString = () => {
      return `[$Archive]`;
    };
    const _valueOf = () => {
      return ``;
    };

    /** Private function */
    const _handleConfig = (conf) => {
      /** Handle config
       *  • For every valid config, parse it to correct format then create Archive object helper
       *    to run the process
       */

      /** Validate config */
      if (!configSchema.test(conf)) {
        logger.warn(conf._id, `Invalid config. Skipping...`);
        return;
      }

      print();
      logger.info(conf._id, `Running...`);

      /** Building options */
      const arcOpts = {
        timeField   : conf.config.timeField,
        cutOffTime  : new Date((Math.floor(Date.now() / 3600000) + conf.config.cutOffsetHours) * 3600000),
        filter      : conf.config.filter,
        updateOnly  : conf.config.updateOnly,
        logField    : conf.config.logField,
        logValue    : conf.config.logValue,
      };
      const childOpts = conf.childs.map(child => ({
        fromColl  : fromDBs[conf.from.db][child.from],
        toColl    : toDBs[conf.to.db][child.to],
        joinParent: conf.config.join,
        joinChild : child.join,
        filter    : child.filter,
        updateOnly: child.updateOnly,
        logField  : child.logField,
        logValue  : child.logValue,
      }));

      /** Create Archive helper and run it */
      $ArchiveTime(fromDBs[conf.from.db][conf.from.coll], toDBs[conf.to.db][conf.to.coll], arcOpts, childOpts).runArchive();
      return;
    };
    const _runArchive = () => {
      /** Query config and run for each one */
      config.find().forEach(_handleConfig);
    };

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
  const $ArchiveExt = function () {
    return {};
  };
  const __$Archive__ = function () {
    return {
      help: function () {
        return `\
[$Archive]
  .func()
`;
      },
    };
  };

  /** Define deploy object */
  const _id = `$Archive`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
{
  const $Archive = Object.assign(${$Archive}, (${$ArchiveExt})());
  $Archive.prototype = (${__$Archive__})();
  $Archive.toString = $Archive[util.inspect.custom] = function () {return this.prototype.help()};
  $Archive.prototype.toString = $Archive.prototype[util.inspect.custom] = function () { return this.help(); }

  Object.deepFreeze($Archive);
  global.$Archive = $Archive;
}`);

  /** Deploy */
  $Deploy(`BIZ`).run(_id, version, changelog, value);
}
