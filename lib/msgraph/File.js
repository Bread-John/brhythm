const fs = require('fs');
const path = require('path');
const { LargeFileUploadTask, StreamUpload } = require('@microsoft/microsoft-graph-client');

const { getClient } = require('./common');

module.exports = {
    getItemByPath: function (msalClient, filePath) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/${process.env.REMOTE_FILES_PATH}/${filePath}`)
                .get()
                .then(function (itemInfo) {
                    resolve(itemInfo);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getFileByPath: function (msalClient, filePath) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/${process.env.REMOTE_FILES_PATH}/${filePath}:/content`)
                .getStream()
                .then(function (stream) {
                    resolve(stream);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    getFileSliceByPath: function (msalClient, filePath, byteStart, byteEnd) {
        return new Promise(function (resolve, reject) {
            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/root:/${process.env.REMOTE_FILES_PATH}/${filePath}:/content`)
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
    createFolderInParent: function (msalClient, folderName, parentId) {
        return new Promise(function (resolve, reject) {
            const folder = {
                'name': folderName,
                'folder': { },
                '@microsoft.graph.conflictBehavior': 'rename'
            };

            const client = getClient(msalClient);
            client
                .api(`/users/${process.env.ADMIN_ACCOUNT_ID}/drive/items/${parentId}/children`)
                .post(folder)
                .then(function (response) {
                    resolve(response);
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    },
    uploadFileToParent: function (msalClient, localFilePath, parentId) {
        return new Promise(function (resolve, reject) {
            const fileName = path.basename(localFilePath);

            const client = getClient(msalClient);
            const payload = {
                item: {
                    '@microsoft.graph.conflictBehavior': 'replace',
                    'name': fileName
                }
            };
            LargeFileUploadTask
                .createUploadSession(
                    client,
                    `/users/${process.env.ADMIN_ACCOUNT_ID}/drive/items/${parentId}:/${fileName}:/createUploadSession`,
                    payload
                )
                .then(function (uploadSession) {
                    const fileSize = fs.statSync(localFilePath).size;
                    const fileStream = fs.createReadStream(localFilePath);
                    const fileObject = new StreamUpload(fileStream, fileName, fileSize);

                    const options = {
                        rangeSize: 5 * 1024 * 1024,
                        uploadEventHandlers: {
                            progress: function (range, extraCallbackParam) {},
                            extraCallbackParam: true
                        }
                    };

                    const uploadTask = new LargeFileUploadTask(client, fileObject, uploadSession, options);

                    uploadTask
                        .upload()
                        .then(function (result) {
                            fs.rm(localFilePath, function (err) {
                                if (err) {
                                    console.error(
                                        `[${new Date(Date.now()).toUTCString()}] - FileSys Error: Failed to delete file at path "${localFilePath}"`
                                    );
                                } else {
                                    console.log(
                                        `[${new Date(Date.now()).toUTCString()}] - FileSys Info: File at path "${localFilePath}" has been deleted`
                                    );
                                }
                                resolve(result['_responseBody']);
                            });
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
