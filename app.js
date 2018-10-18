'use strict';
const Reward = require('./lib/reward');
const Pay = require('./lib/pay');
const config = require('./config');
const reward = new Reward(config);
const pay = new Pay(config);
const dbConn = require('./database/conn');

// pre-start, check service state
dbConn.authenticate().then(() => {
    console.log('database  success');
    // start
    return reward.start();
}).catch((err) => {
    console.log(err, 'reward');
});

// pre-start, check service state
dbConn.authenticate().then(() => {
    console.log('database  success');
    // start
    return pay.start();
}).catch((err) => {
    console.log(err, 'pay');
});
