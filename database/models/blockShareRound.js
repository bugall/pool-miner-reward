const Sequelize = require('sequelize');

module.exports = (conn) => conn.define('tb_block_share_round', ({
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
    diff: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    miner_address: {
        type: Sequelize.STRING
    },
    valid: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}), {
    tableName: 'tb_block_share_round'
});
