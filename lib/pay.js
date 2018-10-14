const loggerFactory = require('./logger.js');
const Stratum = require('stratum-pool');
const BigNumber = require('bignumber.js');

module.exports = class Pay {
    constructor (config) {
        this.minPayment = 0;
        this.config = config;
        this.coin = this.config.coin.name;
        this.logger = loggerFactory.getLogger('PaymentProcessor', this.coin);
        this.processingConfig = this.config.paymentProcessing;
        // eslint-disable-next-line
        this.daemon = new Stratum.daemon.interface([this.processingConfig.daemon], loggerFactory.getLogger('CoinDaemon', this.coin));
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

    minerContributeInRound (round) {
        const shareLookups = rounds.map(function (r) {
            return ['hgetall', this.coin + ':shares:round' + r.height];
        });
    }
};
