deploy: {
  const dbs = DBs(db);
  if (!dbs._mongo?._identity?.api) {
    print(Error(`cannot deploy roles on server ${util.inspect(dbs._mongo)}, must be an api server`));
    break deploy;
  }

  const roles = [
    $Role(dbs.admin, `public`, [], [
      $Privilege(dbs.admin.identity , $Privilege.actions.read),
    ]),
    $Role(dbs.admin, `scriptLoader`, [], [
      $Privilege(dbs._.system.js    , $Privilege.actions.read),
    ]),
  ];
  roles.forEach(_ => _.deploy());
}

deploy: {
  const dbs = DBs(db);
  if (!dbs._mongo?._identity?.api) {
    print(Error(`cannot deploy roles on server ${util.inspect(dbs._mongo)}, must be an api server`));
    break deploy;
  }

  const users = [
    $User(dbs.admin, `billy.bui`, [
      $Role(dbs.admin       , `root`          ),
      $Role(dbs.admin       , `dbOwner`       ),
      $Role(dbs.local       , `dbOwner`       ),
      $Role(dbs.config      , `dbOwner`       ),
    ]),
    $User(dbs.admin, `reader`, [
      $Role(dbs.admin       , `public`        ),
      $Role(dbs.admin       , `scriptLoader`  ),
    ]),
  ];
  users.forEach(_ => _.deploy());
}
