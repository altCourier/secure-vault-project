/* 

db.js is infrastructure, it is shared between all the frontend pages.
It is the same code in server.js in between the lines 18-25.
Additional db.js file has been created to lessen the dependency
chain.

*/

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;