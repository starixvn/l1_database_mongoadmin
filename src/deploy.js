{
  load(`_/deployFunctions.js`);
  load(`_/Deploy.js`);
  load(`_/Object.js`);

  ls().filter(_isDir).forEach(_loadFolder);
}