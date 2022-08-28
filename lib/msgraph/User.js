const { getClient } = require('./common');

module.exports = {
    getUserDetails: function (msalClient, userId) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${userId}`)
                .select('displayName,givenName,id,surname,userPrincipalName')
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
                .api(`/users/${userId}/photos/96x96/$value`)
                .get()
                .then(function (buffer) {
                    resolve(buffer);
                })
                .catch(function (error) {
                    if (error.code === 'ImageNotFound') {
                        resolve(null);
                    } else {
                        reject(error);
                    }
                });
        });
    }
};
