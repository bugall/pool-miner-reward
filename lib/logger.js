const { createLogger, format, transports } = require('winston');
const { splat, combine, timestamp, label, printf } = format;

const logLevel = 'debug';
require('winston-daily-rotate-file');
module.exports = {
    getLogger: (loggerName, coin) => {
        const transportz = [new transports.Console()];

        transportz.push(
            new transports.DailyRotateFile({
                filename: 'logs/nomp_debug.log',
                datePattern: 'YYYY-MM-DD',
                prepend: false,
                localTime: false,
                level: logLevel
            })
        );

        return createLogger({
            format: combine(
                splat(),
                label({
                    label: {
                        loggerName,
                        coin: coin
                    }
                }),
                timestamp(),
                printf(info => {
                    return `[${info.timestamp}] [${info.level}] [${info.label.coin}] [${info.label.loggerName}] : ${info.message}`;
                })
            ),
            level: logLevel,
            transports: transportz
        });
    }
};
