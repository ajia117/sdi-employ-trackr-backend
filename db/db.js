import pgPromise from 'pg-promise';
const pgp = pgPromise({});
const dbParams = {
    platform: "postgresql",
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "docker",
    database: "timelog"
};

let colon = '';
if (dbParams.password) {
    colon = ':'
};
const dbConnect = `${dbParams.platform}://${dbParams.username}${colon}${dbParams.password}@${dbParams.host}:${dbParams.port}/${dbParams.database}`;

var db = pgp(dbConnect)
db.connect()
    .then(obj => {
        const serverVersion = obj.client.serverVersion;
        // console.log(`Connected to database, version `, serverVersion)
        obj.done();
    })
    .catch(error => {
        console.log('Database connection error...')
        console.log('ERROR:', error.message);
    });

export default db;