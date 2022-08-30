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
            sequelize.sync({ alter: alterSync })
                .then(async function () {
                    const [results, ] = await sequelize.query(`SELECT * FROM pg_extension WHERE extname='pg_trgm';`)
                    if (!results) {
                        await sequelize.query(`CREATE EXTENSION pg_trgm;`);
                    }
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
