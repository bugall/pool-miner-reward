const loggerFactory = require('./logger.js');
const Stratum = require('stratum-pool');
const BigNumber = require('bignumber.js');
const { BlockShareRound, BlockShareSubmit } = require('../database');

module.exports = class Reward {
    constructor (config) {
        this.minPayment = 0;
        this.config = config;
        this.coin = this.config.coin.name;
        this.logger = loggerFactory.getLogger('PaymentProcessor', this.coin);
        this.processingConfig = this.config.paymentProcessing;
        // eslint-disable-next-line
        this.daemon = new Stratum.daemon.interface([this.processingConfig.daemon], loggerFactory.getLogger('CoinDaemon', this.coin));
    }
    async isValidShare (content) {
        await BlockShareRound.create({
            coin_name: content.coin,
            height: content.height,
            diff: content.diff,
            miner_address: content.worker,
            valid: 1,
            message_id: content.random,
            created_at: Date.now()
        });
    }
    async invalidShares (content) {
        await BlockShareRound.create({
            coin_name: content.coin,
            height: content.height,
            diff: content.diff,
            miner_address: content.worker,
            valid: 0,
            message_id: content.random,
            created_at: Date.now()
        });
    }
    async isValidBlock (content) {
        const data = await BlockShareSubmit.create({
            coin_name: content.coin,
            height: content.height,
            hash: content.hash,
            tx_hash: content.txHash,
            miner_address: content.worker,
            message_id: content.random,
            created_at: Date.now(),
            status: 0,
            valid: 1
        });
        return data;
    }
    async invalidBlock (content) {
        await BlockShareSubmit.create({
            coin_name: content.coin,
            height: content.height,
            hash: content.hash,
            tx_hash: content.txHash,
            miner_address: content.worker,
            message_id: content.random,
            created_at: Date.now(),
            status: -1,
            valid: 0
        });
    }

    validateaddress (address) {
        return new Promise((resolve, reject) => {
            this.daemon.cmd('validateaddress', [this.poolOptions.address], result => {
                this.logger.silly('Validated %s address with result %s', this.poolOptions.address, JSON.stringify(result));
                if (result.error) {
                    reject('Error with payment processing daemon %s', JSON.stringify(result.error));
                } else if (!result.response || !result.response.ismine) {
                    reject('Daemon does not own pool address - payment processing can not be done with this daemon, %s', JSON.stringify(result.response));
                } else {
                    resolve(true);
                }
            }, true);
        });
    }

    getBalance () {
        return new Promise((resolve, reject) => {
            this.daemon.cmd('getbalance', [], result => {
                var wasICaught = false;
                if (result.error) {
                    reject();
                }
                try {
                    let minimumPayment = new BigNumber(this.processingConfig.minimumPayment);
                    this.logger.silly('minimumPayment = %s', minimumPayment.toString(10));
                    this.minPayment = minimumPayment;
                } catch (e) {
                    this.logger.error('Error detecting number of satoshis in a coin, cannot do payment processing. Tried parsing: %s', JSON.stringify(result.data));
                    wasICaught = true;
                } finally {
                    if (wasICaught) {
                        resolve();
                    } else {
                        reject();
                    }
                }
            }, true, true);
        });
    }

    // 找出块中确认的transaction
    filterTransactionsStatus (rounds) {
        return new Promise((resolve, reject) => {
            const batchRPCcommand = rounds.map(function (r) {
                return ['gettransaction', [r.txHash]];
            });
            batchRPCcommand.push(['getaccount', [this.config.address]]);
            this.daemon.batchCmd(batchRPCcommand, (error, txDetails) => {
                let addressAccount = null;
                if (error || !txDetails) {
                    reject('Check finished - daemon rpc error with batch gettransactions %s', JSON.stringify(error));
                }
                txDetails.forEach(function (tx, i) {
                    if (i === txDetails.length - 1) {
                        // choose addressAccount as last output of generation transaction
                        // because there may masternodes payees and pool address should be last
                        // in zcoin its tx.address
                        addressAccount = tx.result || tx.address;
                        this.logger.warn('Could not decrypt address from tx (no tx.result or tx.address field) %s', JSON.stringify(tx));
                        return;
                    }

                    let round = rounds[i];
                    if (tx.error && tx.error.code === -5) {
                        this.logger.warn('Daemon reports invalid transaction: %s', round.txHash);
                        this.logger.debug('Filtering out round %s as kicked cause of invalid tx', round.height);
                        round.category = 'kicked';
                        return;
                    } else if (!tx.result.details || (tx.result.details && tx.result.details.length === 0)) {
                        this.logger.warn('Daemon reports no details for transaction: %s');
                        this.logger.debug('Filtering out round %s as kicked cause of no details for transaction', round.height);
                        round.category = 'kicked';
                        return;
                    } else if (tx.error || !tx.result) {
                        this.logger.error('Odd error with gettransaction %s. tx = %s', round.txHash, JSON.stringify(tx));
                        round.category = 'kicked';
                        return;
                    }

                    var generationTx = tx.result.details.filter(function (tx) {
                        return tx.address === this.address;
                    })[0];
                    if (!generationTx && tx.result.details.length === 1) {
                        generationTx = tx.result.details[0];
                    }
                    if (!generationTx) {
                        this.logger.error('Missing output details to pool address for transaction %s', round.txHash);
                        return;
                    }
                    round.category = generationTx.category;
                    if (round.category === 'generate') {
                        round.reward = generationTx.amount || generationTx.value;
                    }
                });

                const canDeleteShares = (r) => {
                    for (let i = 0; i < rounds.length; i++) {
                        let compareR = rounds[i];
                        if ((compareR.height === r.height) &&
                            (compareR.category !== 'kicked') &&
                            (compareR.category !== 'orphan') &&
                            (compareR.serialized !== r.serialized)) {
                            return false;
                        }
                    }
                    return true;
                };
                // Filter out all rounds that are immature (not confirmed or orphaned yet)
                rounds = rounds.filter(function (r) {
                    switch (r.category) {
                        case 'orphan':
                        case 'kicked':
                            r.canDeleteShares = canDeleteShares(r);
                            break;
                        case 'generate':
                            return true;
                        default:
                            return false;
                    }
                });
                resolve({
                    rounds,
                    addressAccount
                });
            });
        });
    }

    async minerContributeInRound (round) {
        let allWorkerShares = await BlockShareRound.findAll({
            where: {
                coin_name: this.coin,
                height: round.height
            },
            raw: true
        });

        allWorkerShares = allWorkerShares.map((roundShare) => {
            const resultForRound = {};
            Object.keys(roundShare).forEach((workerStr) => {
                if (workerStr) {
                    if (workerStr.indexOf('.') !== -1) {
                        this.logger.silly('%s worker have both payout address and worker, merging', workerStr);
                        let workerInfo = workerStr.split('.');
                        if (workerInfo.length === 2) {
                            // todo validate by daemon
                            let address = workerInfo[0];
                            if (resultForRound[address]) {
                                this.logger.silly('Already have balance for address %s : %s', address, resultForRound[address].toString(10));
                                resultForRound[address] = resultForRound[address].plus(roundShare[workerStr]);
                                this.logger.silly('New balance %s ', resultForRound[address].toString(10));
                            } else {
                                resultForRound[address] = new BigNumber(roundShare[workerStr]);
                            }
                        }
                    } else {
                        let address = workerStr;
                        if (resultForRound[address]) {
                            this.logger.silly('Already have balance for address %s : %s', address, resultForRound[address].toString(10));
                            resultForRound[address] = resultForRound[address].plus(roundShare[workerStr]);
                            this.logger.silly('New balance %s ', resultForRound[address].toString(10));
                        } else {
                            resultForRound[address] = new BigNumber(roundShare[workerStr]);
                        }
                    }
                } else {
                    this.logger.error('Look around! We have anonymous shares, null worker');
                }
            });
            return resultForRound;
        });

        [round].forEach((round, i) => {
            this.logger.silly('iterating round #%s from allWorkerShares', i);
            this.logger.silly('round = %s', JSON.stringify(round));

            var workerSharesForRound = allWorkerShares[i];
            this.logger.silly('workerSharesForRound = %s', JSON.stringify(workerSharesForRound));
            if (!workerSharesForRound) {
                this.logger.error('No worker shares for round: %s, blockHash %s', round.height, round.blockHash);
                return;
            }

            switch (round.category) {
                case 'kicked':
                case 'orphan':
                    this.logger.warn('Round with height %s and tx %s is orphan', round.height, round.txHash);
                    round.workerShares = workerSharesForRound;
                    break;
                case 'generate':
                    /* We found a confirmed block! Now get the reward for it and calculate how much
                       we owe each miner based on the shares they submitted during that block round. */
                    this.logger.info('We have found confirmed block #%s ready for payout', round.height);
                    this.logger.silly('round.reward = %s', round.reward);
                    var reward = new BigNumber(round.reward);
                    this.logger.silly('reward = %s', reward.toString(10));

                    var totalShares = Object.keys(workerSharesForRound).reduce((p, c) => {
                        if (p === 0) {
                            p = new BigNumber(0);
                        }
                        return p.plus(workerSharesForRound[c]);
                    }, 0);
                    this.logger.silly('totalShares = %s', totalShares.toString(10));

                    Object.keys(workerSharesForRound).forEach((workerAddress) => {
                        this.logger.debug('Calculating reward for workerAddress %s', workerAddress);
                        let percent = workerSharesForRound[workerAddress].dividedBy(totalShares);
                        this.logger.silly('percent = %s', percent.toString(10));
                        let workerRewardTotal = reward.multipliedBy(percent);
                        this.logger.silly('workerRewardTotal = %s', workerRewardTotal.toString(10));
                        let worker = this.workers[workerAddress] = (this.workers[workerAddress] || {});
                        this.logger.silly('worker = %s', JSON.stringify(worker));
                        worker.reward = (worker.reward || new BigNumber(0)).plus(workerRewardTotal);
                        this.logger.silly('worker.reward = %s', worker.reward.toString(10));
                    });
                    break;
            }
        });
    }
};
