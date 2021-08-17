{
  const global = Function(`return this;`)();
  const oldDB = global.db;
  global.db = api.admin;

  load(`_/deployFunctions.js`);
  load(`_/Deploy.js`);
  load(`_/Object.js`);

  ls().filter(_isDir).forEach(_loadFolder);

  global.db = oldDB;
}