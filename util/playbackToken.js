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
    verifyAuthToken: function (token) {
        return new Promise(function (resolve, reject) {
            jwt.verify(token, process.env.STREAM_TOKEN_SECRET, { algorithm: 'HS512' }, function (err, token) {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }
};