module.exports = {
    'address': 'AFoXi9fqxPxoKSiAQhQRUyMZjuKp9GzP1k',
    'rewardRecipients': {
        'AFoXi9fqxPxoKSiAQhQRUyMZjuKp9GzP1k': 1.5,
        'AFoh2BoTjtrNS6jvLFZfw464bhVnpeeXqa': 0.1
    },
    'paymentProcessing': {
        'enabled': true,
        'paymentInterval': 10,
        'minimumPayment': 0.01,
        'daemon': {
            'host': '47.105.37.187',
            'port': 8766,
            'user': 'test',
            'password': 'test123'
        }
    },
    coin: {
        name: 'IDA',
        symbol: 'IDA',
        algorithm: 'x16r'
    },
    queue: {
        accountId: '1232343283010740',
        accessId: 'LTAIYRJChzRtWw0B',
        secretKey: '0PmcaHIejjU7CPV5bWowvacszI1Q3h',
        queueName: 'PoolQueue'
    },
    database: {
        host: 'rm-uf6wi068g51h6wnwa9o.mysql.rds.aliyuncs.com',
        port: 3306,
        username: 'root',
        password: 'HskASTr%$HSS',
        db: 'pool'
    }
};
