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
    syncModels: function (alterSync) {
        return new Promise(function (resolve, reject) {
            sequelize
                .sync({ alter: alterSync })
                .then(function () {
                    resolve();
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    },
    newTransaction: function () {
        return new Promise(function (resolve, reject) {
            sequelize.transaction()
                .then(function (t) {
                    resolve(t);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }
};
