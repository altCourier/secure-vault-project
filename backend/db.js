/* 

db.js is infrastructure, it is shared between all the frontend pages.
It is the same code in server.js in between the lines 18-25.
Additional db.js file has been created to lessen the dependency
chain.

*/

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mfa_system',
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;