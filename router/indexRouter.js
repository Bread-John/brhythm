const express = require('express');
const fs = require('fs');
const nodeID3 = require('node-id3');

const fileUpload = require('../lib/fileUploads');
const { getUserDetails } = require('../lib/msgraph/User');
const { getFileById } = require('../lib/msgraph/File');
const { UserFacingError } = require('../lib/customError');

const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send('<h2>Hello, world!</h2>');
});

router.post('/upload', fileUpload.array('files', 10), function (req, res, next) {
    req.files.map(function (file) {
        nodeID3.read(file.path, { onlyRaw: true }, function (error, tags) {
            if (error) next(error);

            // Details on these tag names are here: https://github.com/Zazama/node-id3#supported-raw-ids
            const { TIT2, TPE1, TALB, TPE2, TCON, TRCK, TPOS, TCOM, TYER } = tags;
            const { imageBuffer } = tags['APIC'];

            Artist
                .findOrCreate({
                    where: { name: TPE1 }
                })
                .then(function (artist, created) {
                    return artist.id;
                })
                .then(function (artistId) {
                    console.log()
                })
                .catch(function (error) {
                    next(error);
                });
        });
    });
    res.status(200).send('Done');
});

router.get('/user', function (req, res, next) {
    getUserDetails(req.app.locals.msalClient, req.session.userId.split('.')[0])
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/play', function (req, res, next) {
    getFileById(req.app.locals.msalClient, '01RJNJU2VUEQCT2FUYFJGJSLAEDURVUXJH')
        .then(function (response) {
            res.redirect(response);
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/stream/:resourceId/:resourceName', function (req, res, next) {
    const { resourceId, resourceName } = req.params;

    const filePath = `${process.env.TEMP_FILES_PATH}/${resourceId}/${resourceName}`;
    fs.access(filePath, fs.constants.F_OK, function (err) {
        if (err) {
            next(new UserFacingError(`Resource not found`, 404));
        } else {
            const stream = fs.createReadStream(filePath);
            stream.on('error', err => next(err));
            stream.on('end', () => res.end());
            stream.pipe(res);
        }
    });
});

module.exports = router;
