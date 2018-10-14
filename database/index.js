const conn = require('./conn');
const blockShareRound = require('./models/blockShareRound');
const blockShareSubmit = require('./models/blockShareSubmit');

module.exports = {
    BlockShareRound: blockShareRound(conn),
    BlockShareSubmit: blockShareSubmit(conn)
};
