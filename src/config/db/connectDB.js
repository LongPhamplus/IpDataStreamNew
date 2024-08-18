const pgp = require('pg-promise')();

const client = {
    user: 'postgres',
    password: 'Long@123',
    host: 'localhost',
    port: '5432',
    database: 'postgres'
}

const db = pgp(client);

module.exports = db