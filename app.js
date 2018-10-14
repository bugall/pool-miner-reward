'use strict';
const Reward = require('./lib');
const config = require('./config');
const reward = new Reward(config);
const dbConn = require('./database/conn');

// pre-start, check service state
dbConn.authenticate().then(() => {
    console.log('database  success');
    // start
    return reward.start();
}).catch((err) => console.log(err.stack));
