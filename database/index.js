const conn = require('./conn');
const blockShareRound = require('./models/block');

module.exports = {
    BlockShareRound: blockShareRound(conn)
};
