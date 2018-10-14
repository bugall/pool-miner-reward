const dev = require('./development');
const prod = require('./product');

let config = dev;
if (process.env.NODE_ENV === 'production') {
    config = prod;
}

module.exports = config;
