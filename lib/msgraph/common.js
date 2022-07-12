const graph = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

module.exports = {
    getClient: function getClient(msalClient, userId) {
        if (!msalClient || !userId) {
            throw new ReferenceError(
                `Invalid MSAL state: MSAL Client is ${msalClient ? 'present' : 'missing'}, User ID is ${userId ? 'present' : 'missing'}`
            );
        } else {
            return graph.Client.init({
                authProvider: function (callback) {
                    msalClient
                        .getTokenCache()
                        .getAccountByHomeId(userId)
                        .then(function (account) {
                            if (account) {
                                msalClient
                                    .acquireTokenSilent({
                                        account: account,
                                        scopes: process.env.SCOPES.split(',')
                                    })
                                    .then(function (response) {
                                        callback(null, response.accessToken);
                                    })
                                    .catch(function (error) {
                                        callback(error, null);
                                    });
                            }
                        })
                        .catch(function (error) {
                            callback(error, null);
                        });
                }
            });
        }
    }
}
