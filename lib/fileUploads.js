const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storageOpts = {
    destination: function (req, file, callback) {
        const tempFilePath = `${process.env.TEMP_FILES_PATH}/${Date.now()}${Math.round(Math.random() * 1E5)}`;
        fs.mkdir(tempFilePath, { recursive: true }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, tempFilePath);
            }
        });
    },
    filename: function (req, file, callback) {
        callback(null, `brhythm_original${path.extname(file.originalname)}`);
    }
};

function fileFilter(req, file, callback) {
    const allowedFileTypes = [
        'audio/aac',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav'
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
