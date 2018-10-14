const Sequelize = 'sequelize';
const config = '../config';
const database = config.database;

const conn = new Sequelize(database.db, database.username, database.password, {
    host: database.host,
    dialect: 'mysql',
    logging: true,
    timezone: '+08:00',
    pool: 10
});

conn.authenticate()
  .then(() => console.log('database  success'))
  .catch((err) => console.log(err.stack));

module.exports = conn;
