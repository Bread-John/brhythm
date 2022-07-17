const express = require('express');
const fs = require('fs');
const nodeID3 = require('node-id3');

const fileUpload = require('../lib/fileUploads');
const { getUserDetails } = require('../lib/msgraph/User');
const { getFileById } = require('../lib/msgraph/File');
const { UserFacingError } = require('../lib/customError');
const { newTransaction } = require('../dao/main');
const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send('<h2>Hello, world!</h2>');
});

router.post('/upload', fileUpload.single('media'), async function (req, res, next) {
    if (!req.file) {
        throw new UserFacingError(`Uploaded file is not accepted`, 400);
    } else {
        // Details on these tag names are here: https://github.com/Zazama/node-id3#supported-raw-ids
        const {
            TIT2, TPE1, TALB, TPE2, TCON,
            TRCK, TPOS, TCOM, TYER, TPUB,
            APIC
        } = nodeID3.read(req.file.path, { onlyRaw: true });
        const { imageBuffer } = APIC;
        const [trackNo, totalTrackNo] = TRCK.split('/');
        const [discNo, totalDiscNo] = TPOS.split('/');

        const t = await newTransaction();
        try {
            const [artist, ] = await Artist.findOrCreate({
                where: { name: TPE1 || 'Unnamed Artist' },
                transaction: t
            });

            async function createAlbumArtist() {
                if (TPE2 && TPE2 !== TPE1) {
                    return await Artist.findOrCreate({
                        where: { name: TPE2 },
                        transaction: t
                    });
                } else {
                    return [artist, false];
                }
            }
            const [albumArtist, ] = await createAlbumArtist();

            const [album, ] = await Album.findOrCreate({
                where: {
                    title: TALB || 'Untitled',
                    artistId: albumArtist.id
                },
                defaults: {
                    genre: TCON,
                    releaseYear: TYER,
                    totalTrackNo: totalTrackNo,
                    totalDiscNo: totalDiscNo,
                    publisher: TPUB,
                    coverImg: 'local'
                },
                transaction: t
            });

            const [song, created] = await Song.findOrCreate({
                where: {
                    title: TIT2 || 'Untitled',
                    albumId: album.id,
                    artistId: artist.id,
                    ownerId: process.env.ADMIN_ACCOUNT_ID
                },
                defaults: {
                    composer: TCOM,
                    trackNo: trackNo,
                    discNo: discNo,
                    fileName: req.file.originalname,
                    fileLocation: 'ONEDRIVE'
                },
                transaction: t
            });

            await t.commit();

            res.status(200).send('Done');
        } catch (error) {
            await t.rollback();

            next(error);
        }
    }
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
