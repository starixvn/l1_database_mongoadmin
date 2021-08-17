{
  const global = Function(`return this`)();

  const getFileObj = (path) => {
    const rgName = /([\/]|^)([^\/]*)[\/]?$/;
    const name = rgName.exec(path)[2];
    const list = global.listFiles(`${path}/..`);
    return list.filter(_ => _.baseName == name)[0];
  }
  const isDir = (path) => {
    const obj = getFileObj(path);
    return !!obj && obj.isDirectory;
  };
  global._isDir = (...args) => { return isDir(...args); };
  const isFile = (path, idx) => {
    const obj = getFileObj(path);
    return !!obj && !obj.isDirectory;
  };
  global._isFile = (...args) => { return isFile(...args); };
  const getName = (obj) => {
    return obj.name;
  }
  const loadFile = (path) => {
    if (!global.pathExists(path)) return false;
    global.load(path);
    return true;
  }
  global._loadFile = (...args) => { return loadFolder(...args); };
  const loadFolder = (path) => {
    const obj = getFileObj(path);
    if (!obj) return false;
    if (!obj.isDirectory) return false;
    if (obj.baseName == `_`) return false;

    const list = global.listFiles(path);
    list.map(getName).filter(isDir).forEach(loadFolder);
    list.map(getName).filter(isFile).forEach(loadFile);
    return true;
  }
  global._loadFolder = (...args) => { return loadFolder(...args); };
}