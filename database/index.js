const conn = require('./conn');
const blockShareRound = require('./models/blockShareRound');

module.exports = {
    BlockShareRound: blockShareRound(conn)
};
