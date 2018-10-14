'use strict';
const Reward = require('./lib');
const config = require('./config');
const AliMNS = require("ali-mns");
const account = new AliMNS.Account('1232343283010740', 'LTAIYRJChzRtWw0B', '0PmcaHIejjU7CPV5bWowvacszI1Q3h');
const regionSingapore = new AliMNS.Region(AliMNS.City.Singapore, AliMNS.NetworkType.Public);
const mq = new AliMNS.MQ('PoolQueue', account, regionSingapore);

// send message
mq.sendP("Hello ali-mns").then(console.log, console.error);
new Reward(config);
