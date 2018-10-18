const RewardUtil = require('./reward.util');
const Queue = require('../queue');
const loggerFactory = require('../logger.js');
const _ = require('lodash');

module.exports = class Reward extends RewardUtil {
    constructor (poolConfig) {
        super(poolConfig);
        this.logger = loggerFactory.getLogger('PaymentProcessing', 'system');
        this.logger.info('Payment processor worker started');
        this.queue = {
            common: new Queue(poolConfig.queue, 'common'),
            confirm: new Queue(poolConfig.queue, 'confirm')
        };
    }

    async start () {
        await this.controller();
    }

    async controller () {
        const content = await this.queue.common.getMessage();
        await this.logic(content);
    }

    isJSON (str) {
        if (typeof str === 'string') {
            try {
                const obj = JSON.parse(str);
                if (typeof obj === 'object' && obj) {
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                return false;
            }
        }
    }
    async logic (content) {
        if (!this.isJSON(content.Message.MessageBody)) {
            if (_.isEmpty(content.Message)) {
                await this.controller();
            }
            await this.queue.deleteMessage(content.Message.ReceiptHandle);
            await this.controller();
        }

        const messageContent = JSON.parse(content.Message.MessageBody);

        switch (messageContent.action) {
            case 'isValidShare':
                try {
                    await this.isValidShare(messageContent.info);
                } catch (err) {
                    console.log(err);
                }
                break;
            case 'invalidShares':
                try {
                    await this.invalidShares(messageContent.info);
                } catch (err) {
                    console.log(err);
                }
                break;
            case 'isValidBlock':
                try {
                    const data = await this.isValidBlock(messageContent.info);
                    await this.queue.confirm.send([JSON.stringify(data.dataValues)]);
                } catch (err) {
                    console.log(err);
                }
                break;
            case 'invalidBlock':
                try {
                    await this.invalidBlock(messageContent.info);
                } catch (err) {
                    console.log(err);
                }
                break;
            default:
                break;
        }
        // 标记消息处理完毕
        try {
            await this.queue.deleteMessage(content.Message.ReceiptHandle);
        } catch (err) {

        }
        await this.controller();
    }
};