## Mongo Admin API services

### Preparation
For the service to run successfully, `secrets/keyFile` secret must be created and set permission as follow:
```bash
sudo chown 999:999 secrets/keyFile
sudo chmod 400 secrets/keyFile
```
In addition, a docker network `luminet_internal_network` must be created:
```bash
docker network create --subnet '172.39.0.0/19' luminet_internal_network
```
Also, we must specify the port that the mongo instance will serve in `.env` file
```env
MONGOD_PORT=17104
```

### Deployment
Only need to run compose up command:
```bash
docker-compose up -d
```

### Mongo replica set config
On the first deployment, we must config replica set for this instance. After authenticate, run following procedure:

#### First instance
- Connect to the new instance from **localhost**
- Initiate
    ```javascript
    rs.initiate()
    ```
- Modify config
    ```javascript
    conf = rs.config()
    conf.version++
    conf.members[0].host = '10.10.50.1x:17104'
    conf.settings.electionTimeoutMillis = 3000
    ```
- Check config
    ```javascript
    conf
    ```
- Reconfigure
    ```javascript
    rs.reconfig(conf)
    ```

#### Other intances
- Connect to the PRIMARY instance
- Add secondary node
    ```javascript
    rs.add('10.10.50.1x:17104')
    ```

#### Verify replica set status
```javascript
rs.status()
```
