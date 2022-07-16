const sequelize = require('./config');

module.exports = {
    testConnection: function () {
        return new Promise(function (resolve, reject) {
            sequelize.authenticate()
                .then(function () {
                    resolve();
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    syncModels: function () {
        return new Promise(function (resolve, reject) {
            sequelize.sync()
                .then(function () {
                    resolve();
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }
};
