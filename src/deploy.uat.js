deploy: {
  const oldDB = global.db;
  global.db = api_uat.admin;
  global.dbs = DBs(global.db);
  if (!dbs._mongo?._identity?.api) {
    print(Error(`cannot deploy roles on server ${util.inspect(dbs._mongo)}, must be an api server`));
    break deploy;
  }

  loadScript(`_/Deploy.js`);
  ls('.', _isDir).forEach(loadFolder);
  loadScript(`_/Security.js`);

  global.db = oldDB;
  global.dbs = DBs(global.db);
}
