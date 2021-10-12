{
  const coll = `identity`;
  if (dbs.admin.getCollectionInfos({name: coll}).length == 0) try {
    dbs.admin.createCollection(coll, {capped: true, size: 1, max: 1});
    print(`Success`, `Collection created.`);
    dbs.admin.identity.updateOne({_id: 'AdminAPI'}, {$set: {api: true}}, {upsert: true});
  } catch (e) {
    print(`Failure`, e);
  }
}
