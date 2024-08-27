const pgp = require('pg-promise')();
require('dotenv').config();



const client = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
}

const db = pgp(client);

module.exports = db