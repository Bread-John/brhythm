const express = require('express');
const nodeID3 = require('node-id3');
const path = require('path');

const multer = require('../lib/multer');
const { ensureAuthenticatedAsAdmin } = require('../lib/passport');
const { getItemByPath, uploadFileToParent } = require('../lib/msgraph/File');
const { UserFacingError } = require('../lib/customError');
const { cleanUpTempFolder } = require('../util/tempFileCleaner');
const { analyseMedia, convertToHlsLossy } = require('../util/ffmpeg');
const { getCoverArt, getAlbumDesc } = require('../util/musicMetadata');

const { newTransaction } = require('../dao/main');
const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.post('/upload', /*ensureAuthenticatedAsAdmin,*/ multer.single('media'), async function (req, res, next) {
    const { visibility } = req.body;
    if (!req.file) {
        next(new UserFacingError(`Uploaded file is not accepted`, 400));
    } else {
        const fileIdentifier = path.basename(req.file.path, path.extname(req.file.path));

        // Details on these tag names are here: https://github.com/Zazama/node-id3#supported-raw-ids
        const {
            TIT2, TPE1, TALB, TPE2, TCON,
            TRCK, TPOS, TCOM, TYER, TPUB
        } = nodeID3.read(req.file.path, { onlyRaw: true });
        const [trackNo, totalTrackNo] = TRCK ? TRCK.split('/') : [];
        const [discNo, totalDiscNo] = TPOS ? TPOS.split('/') : [];

        const t = await newTransaction();
        try {
            const { duration } = await analyseMedia(req.file.path);
            if (duration > 60 * 60) {
                next(new UserFacingError(`Uploaded file is not accepted`, 400));
            }

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

            const description = await getAlbumDesc(TALB, TPE2 ? TPE2 : TPE1);
            const coverImg = await getCoverArt(TALB, TPE2 ? TPE2 : TPE1);
            const [album, ] = await Album.findOrCreate({
                where: {
                    title: TALB || 'Untitled',
                    artistId: albumArtist.id
                },
                defaults: {
                    genre: TCON,
                    releaseYear: TYER,
                    releaseDate: null,
                    totalTrackNo: totalTrackNo,
                    totalDiscNo: totalDiscNo,
                    publisher: TPUB,
                    description,
                    coverImg
                },
                transaction: t
            });

            const [song, ] = await Song.findOrCreate({
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
                    duration: duration,
                    fileName: req.file.originalname,
                    fileIdentifier: fileIdentifier,
                    visibility: visibility ? visibility : 1
                },
                transaction: t
            });

            const outputFiles = await convertToHlsLossy(req.file.destination, fileIdentifier, req.file.filename);
            for (const file of outputFiles) {
                const { id: folderId } = await getItemByPath(req.app.locals.msalClient, 'stream');
                await uploadFileToParent(req.app.locals.msalClient, file, folderId);
            }

            const { id: folderId } = await getItemByPath(req.app.locals.msalClient, 'source');
            await uploadFileToParent(req.app.locals.msalClient, req.file.path, folderId);

            await cleanUpTempFolder(req.file.destination);

            await t.commit();

            res.status(200).json({
                ack: true,
                message: `Music (${artist.name} - ${song.title}) has been uploaded`
            });
        } catch (error) {
            await t.rollback();

            await cleanUpTempFolder(req.file.destination);

            next(error);
        }
    }
});

router.get('/download', function (req, res, next) {
    res.status(200).send('Not implemented');
});

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
