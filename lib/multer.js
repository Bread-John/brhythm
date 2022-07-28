const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storageOpts = {
    destination: function (req, file, callback) {
        const randFolder = crypto.randomUUID();
        fs.mkdir(`${process.env.TEMP_FILES_PATH}/${randFolder}`, { recursive: true }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, `${process.env.TEMP_FILES_PATH}/${randFolder}`);
            }
        });
    },
    filename: function (req, file, callback) {
        callback(null, `${Date.now()}${Math.round(Math.random() * 1E5)}${path.extname(file.originalname)}`);
    }
};

function fileFilter(req, file, callback) {
    const allowedFileTypes = [
        'audio/aac',
        'audio/flac',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/x-flac'
    ];

    if (allowedFileTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
}

module.exports = multer({
    fileFilter: fileFilter,
    limits: {
        fileSize: 95 * 1024 * 1024
    },
    storage: multer.diskStorage(storageOpts)
});
