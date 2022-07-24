const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storageOpts = {
    destination: function (req, file, callback) {
        fs.access(process.env.TEMP_FILES_PATH, fs.constants.F_OK, function (err) {
            if (err) {
                fs.mkdir(process.env.TEMP_FILES_PATH, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, process.env.TEMP_FILES_PATH);
                    }
                });
            } else {
                callback(null, process.env.TEMP_FILES_PATH);
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