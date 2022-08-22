const fs = require('fs');

module.exports = function (folderPath) {
    return new Promise(function (resolve) {
        fs.rm(folderPath, { maxRetries: 3, recursive: true }, function (err) {
            if (err && err.code === 'ENOENT') {
                console.info(
                    `[${new Date(Date.now()).toUTCString()}] - FileSys Info: Deletion of folder at path "${folderPath}" was skipped`
                );
            } else if (err) {
                console.error(
                    `[${new Date(Date.now()).toUTCString()}] - FileSys Error: Failed to delete folder at path "${folderPath}"`
                );
            } else {
                console.info(
                    `[${new Date(Date.now()).toUTCString()}] - FileSys Info: Folder at path "${folderPath}" has been deleted`
                );
            }
            resolve();
        });
    });
};
