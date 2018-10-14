const Sequelize = require('sequelize');
const config = require('../config');
const database = config.database;

const conn = new Sequelize(database.db, database.username, database.password, {
    host: database.host,
    dialect: 'mysql',
    logging: true,
    timezone: '+08:00',
    pool: 10,
    define: {
        timestamps: false
    }
});

module.exports = conn;
