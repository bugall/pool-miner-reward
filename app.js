'use strict';
const config = require('./config');

const Reward = require('./lib/reward');
const Pay = require('./lib/pay');
const Confirm = require('./lib/confirm');

const reward = new Reward(config);
const pay = new Pay(config);
const confirm = new Confirm(config);

const dbConn = require('./database/conn');

// pre-start, check service state
dbConn.authenticate().then(() => {
    console.log('Reward Service Start');
    // start
    return reward.start();
}).catch((err) => {
    console.log(err, 'reward');
});
// pre-start, check service state
dbConn.authenticate().then(() => {
    console.log('Confirm Service Start');
    // start
    return confirm.start();
}).catch((err) => {
    console.log(err, 'pay');
});

// pre-start, check service state
dbConn.authenticate().then(() => {
    console.log('Pay Service Start');
    // start
    return pay.start();
}).catch((err) => {
    console.log(err, 'pay');
});
