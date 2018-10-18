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
            'host': '',
            'port': '',
            'user': '',
            'password': ''
        }
    },
    coin: {
        name: '',
        symbol: '',
        algorithm: ''
    },
    queue: {
        accountId: '',
        accessId: '',
        secretKey: '',
        queues: {
            common: '',
            confirm: '',
            pay: ''
        }
    },
    database: {
        host: '',
        port: '',
        username: '',
        password: '',
        db: ''
    }
};
