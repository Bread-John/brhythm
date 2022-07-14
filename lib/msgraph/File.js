const fs = require('fs');

const { getClient } = require('./common');
const { convertToHls } = require('../ffmpeg');

module.exports = {
    getFileById: function (msalClient, fileId) {
        return new Promise(function (resolve, reject) {
            const fileName = `${fileId}.m3u8`;
            const filePath = `tmp/${fileName}`;
            fs.access(filePath, fs.constants.F_OK, function (err) {
                if (err) {
                    const client = getClient(msalClient);
                    client
                        .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/items/${fileId}/content`)
                        .getStream()
                        .then(function (stream) {
                            return convertToHls(stream, filePath);
                        })
                        .then(function () {
                            resolve(`/stream/${fileName}`);
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                } else {
                    resolve(`/stream/${fileName}`);
                }
            });
        });
    }
};
