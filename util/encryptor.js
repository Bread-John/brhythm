const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    generateKeyFiles: function (filePath, fileIdentifier) {
        return new Promise(function (resolve, reject) {
            crypto.randomBytes(16, function (err, key) {
                if (err) return reject(err);

                fs.writeFile(`${filePath}/brhythm_${fileIdentifier}_stream_enc.key`, key, function (err) {
                    if (err) return reject(err);

                    crypto.randomBytes(16, function (err, iv) {
                        if (err) return reject(err);

                        const keyInfo =
                            `${process.env.API_DOMAIN}/key/brhythm_${fileIdentifier}_stream_enc.key\n` +
                            `${filePath}/brhythm_${fileIdentifier}_stream_enc.key\n` +
                            `${iv.toString('hex')}\n`
                        ;
                        fs.writeFile(`${filePath}/${fileIdentifier}.keyinfo`, keyInfo, function (err) {
                            if (err) return reject(err);

                            resolve({
                                key: `${filePath}/brhythm_${fileIdentifier}_stream_enc.key`,
                                keyInfo: `${fileIdentifier}.keyinfo`
                            });
                        });
                    });
                });
            });
        });
    }
};
