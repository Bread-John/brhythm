const graph = require('@microsoft/microsoft-graph-client');

const { ApplicationError } = require('../customError');

module.exports = {
    getClient: function getClient(msalClient) {
        if (!msalClient) {
            throw new ApplicationError(`Invalid MSAL state: MSAL Client is ${msalClient ? 'present' : 'missing'}`);
        } else {
            return graph.Client.init({
                authProvider: function (callback) {
                    msalClient
                        .acquireTokenByClientCredential({
                            scopes: ['.default']
                        })
                        .then(function (response) {
                            callback(null, response.accessToken);
                        })
                        .catch(function (error) {
                            callback(error, null);
                        });
                }
            });
        }
    }
};
