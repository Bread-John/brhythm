const fs = require('fs');
const { LargeFileUploadTask, StreamUpload, UploadEventHandlers } = require('@microsoft/microsoft-graph-client');

const { getClient } = require('./common');

function getBrhythmDirId(client) {
    return new Promise(function (resolve, reject) {
        client
            .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/BrhythmFiles`)
            .select('id')
            .get()
            .then(function (response) {
                resolve(response.id);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

module.exports = {
    createFolder: function (msalClient, folderName) {
        return new Promise(function (resolve, reject) {
            const folder = {
                'name': folderName,
                'folder': { },
                '@microsoft.graph.conflictBehavior': 'rename'
            };

            const client = getClient(msalClient);
            getBrhythmDirId(client)
                .then(function (directoryId) {
                    resolve(directoryId);
                    /*client
                        .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/items/${directoryId}/children`)
                        .post(folder)
                        .then(function (response) {
                            resolve(response);
                        })
                        .catch(function (error) {
                            reject(error);
                        });*/
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getFileInfoByName: function (msalClient, fileName) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/BrhythmFiles/${fileName}`)
                .get()
                .then(function (fileInfo) {
                    resolve(fileInfo);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getFileByName: function (msalClient, fileName) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/BrhythmFiles/${fileName}:/content`)
                .getStream()
                .then(function (stream) {
                    resolve(stream);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getPartialFileByName: function (msalClient, fileName, byteStart, byteEnd) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/BrhythmFiles/${fileName}:/content`)
                .header('Range', `bytes=${byteStart}-${byteEnd}`)
                .get()
                .then(function (stream) {
                    resolve(stream);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    uploadFile: function (msalClient, localFilePath, fileName, remoteFolderId) {
        return new Promise(function (resolve, reject) {
            const payload = {
                item: {
                    '@microsoft.graph.conflictBehavior': 'replace',
                    'name': fileName
                }
            };

            const client = getClient(msalClient);
            LargeFileUploadTask
                .createUploadSession(
                    client,
                    `/users/${process.env.ADMIN_ACCOUNT_ID}/drive/items/${remoteFolderId}:/${fileName}:/createUploadSession`,
                    payload
                )
                .then(function (uploadSession) {
                    const fileSize = fs.statSync(localFilePath).size;
                    const fileStream = fs.createReadStream(localFilePath);
                    const fileObject = new StreamUpload(fileStream, fileName, fileSize);

                    const options = {
                        rangeSize: 5 * 1024 * 1024,
                        uploadEventHandlers: UploadEventHandlers
                    };

                    const uploadTask = new LargeFileUploadTask(client, fileObject, uploadSession, options);

                    uploadTask.upload()
                        .then(function (result) {
                            resolve(result);
                        })
                        .catch(function (error) {
                            reject(error);
                        });
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    }
};
