{
  const getMongoObject = (ref) => {
    let _db = ref;
    _db = _db ? _db : global.db
    _db = _db._mongo ? _db._mongo : _db;
    _db = _db instanceof Mongo ? _db : null;
    return _db;
  };
  const loadServerScripts = function(ref) {
    const mongo = getMongoObject(ref);
    if (!mongo) return;
    mongo.getDBNames().forEach(_ => {
      mongo.getDB(_).loadServerScripts();
    });
  };

  /** Define deploy object */
  const _id = `loadServerScripts`;
  const version = `1.0.0`;
  const changelog = {
    '1.0.0': [
      `Release [${_id}]`,
    ],
  };
  const value = new Code(`\
(() => {
  const getMongoObject = ${tojson(getMongoObject)};
  const loadServerScripts = ${tojson(loadServerScripts)};
  return loadServerScripts;
})()`);

  /** Deploy */
  $Deploy(`admin`).run(_id, version, changelog, value);
}