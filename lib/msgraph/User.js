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
                .then(async function (blob) {
                    const buffer = Buffer.from(await blob.arrayBuffer());
                    const profilePic = `data:${blob.type};base64,${buffer.toString('base64')}`;

                    resolve(profilePic);
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
