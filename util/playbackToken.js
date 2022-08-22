const jwt = require('jsonwebtoken');

module.exports = {
    generateAuthToken: function (payload, expiresIn) {
        return new Promise(function (resolve, reject) {
            jwt.sign(payload, process.env.STREAM_TOKEN_SECRET, {
                algorithm: 'HS512',
                expiresIn: expiresIn
            }, function (err, token) {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    },
    generateKeyingToken: function (payload) {
        return new Promise(function (resolve, reject) {
            jwt.sign(payload, process.env.DECRYPT_TOKEN_SECRET, {
                algorithm: 'HS512',
                expiresIn: 15
            }, function (err, token) {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    },
    verifyAuthToken: function (token) {
        return new Promise(function (resolve, reject) {
            jwt.verify(token, process.env.STREAM_TOKEN_SECRET, { algorithm: 'HS512' }, function (err, payload) {
                if (err) {
                    reject(err);
                } else {
                    resolve(payload);
                }
            });
        });
    },
    verifyKeyingToken: function (token) {
        return new Promise(function (resolve, reject) {
            jwt.verify(token, process.env.DECRYPT_TOKEN_SECRET, { algorithm: 'HS512' }, function (err, payload) {
                if (err) {
                    reject(err);
                } else {
                    resolve(payload);
                }
            });
        });
    }
};
