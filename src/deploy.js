{
  const oldDB = global.db;
  global.db = api.admin;
  global.dbs = DBs(global.db);

  load(`_/Deploy.js`);

  ls('.', _isDir).forEach(loadFolder);

  global.db = oldDB;
  global.dbs = DBs(global.db);
}
