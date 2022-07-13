const { getClient } = require('./common');

module.exports = {
    getUserDetails: function (msalClient, userId) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${userId}`)
                .select('displayName,mail,userPrincipalName')
                .get()
                .then(function (user) {
                    resolve(user);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getUserProfilePic: function (msalClient, userId) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${userId}/photos/200x200/$value`)
                .get()
                .then(function (rawPhoto) {
                    resolve(rawPhoto.toString('base64'));
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    }
};
