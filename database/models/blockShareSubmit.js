const Sequelize = require('sequelize');

module.exports = (conn) => conn.define('tb_block_share_submit', ({
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    coin_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    height: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    hash: {
        type: Sequelize.STRING,
        allowNull: false
    },
    tx_hash: {
        type: Sequelize.STRING,
        allowNull: false
    },
    miner_address: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0
    },
    valid: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    message_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}), {
    tableName: 'tb_block_share_submit'
});
