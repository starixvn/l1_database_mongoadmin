{
  const oldDB = global.db;
  global.db = api.admin;

  load(`_/Deploy.js`);

  const tasks = [];
  ls('.', _isDir).forEach(_ => {
    tasks.push(loadFolder(_));
  });
  console.log(Promise.allSettled(tasks).then(_ => _.value));

  global.db = oldDB;
}
