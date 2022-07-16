const fs = require('fs');
const multer = require('multer');

const storageOpts = {
    destination: function (req, file, callback) {
        fs.access(process.env.TEMP_FILES_PATH, function (err) {
            if (err) {
                fs.mkdir(process.env.TEMP_FILES_PATH, function (err) {
                    if (err) callback(err);
                });
            }
            callback(null, process.env.TEMP_FILES_PATH);
        });
    },
    filename: function (req, file, callback) {
        callback(null, `${Date.now()}-${file.originalname}`);
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
        fileSize: 50 * 1024 * 1024
    },
    storage: multer.diskStorage(storageOpts)
});
