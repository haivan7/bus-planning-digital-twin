// ~/bus-admin-backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
    user: 'my_bus_admin',
    host: 'localhost',
    database: 'bus_db',
    password: 'abc123', 
    port: 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
