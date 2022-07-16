const fs = require('fs');

const { getClient } = require('./common');
const { convertToHls } = require('../ffmpeg');
const { ApplicationError } = require("../customError");

module.exports = {
    getFileById: function (msalClient, fileId) {
        return new Promise(function (resolve, reject) {
            const localPath = `${process.env.TEMP_FILES_PATH}/${fileId}`;
            fs.access(localPath, fs.constants.F_OK, function (err) {
                if (err) {
                    fs.mkdir(localPath, { recursive: true }, function (err) {
                        if (err) {
                            reject(new ApplicationError(`Could not make directory with path "${localPath}"`));
                        } else {
                            const client = getClient(msalClient);
                            client
                                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/items/${fileId}/content`)
                                .getStream()
                                .then(function (stream) {
                                    return convertToHls(stream, localPath);
                                })
                                .then(function () {
                                    resolve(`/stream/${fileId}/brhythm_index.m3u8`);
                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        }
                    });
                } else {
                    resolve(`/stream/${fileId}/brhythm_index.m3u8`);
                }
            });
        });
    }
};
