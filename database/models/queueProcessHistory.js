const Sequelize = require('sequelize');

module.exports = (conn) => conn.define('tb_queue_process_history', ({
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    message_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    content: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}), {
    tableName: 'tb_queue_process_history'
});
