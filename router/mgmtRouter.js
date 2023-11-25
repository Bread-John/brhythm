const express = require('express');
const path = require('path');

const multer = require('../lib/multer');
const { ensureAuthenticatedAsAdmin } = require('../lib/passport');
const { getItemByPath, uploadFileToParent } = require('../lib/msgraph/File');
const { UserFacingError } = require('../lib/customError');
const id3tagParser = require('../util/id3tagParser');
const tempFileCleaner = require('../util/tempFileCleaner');
const { generateKeyFiles } = require('../util/encryptor');
const { analyseMedia, convertToHlsLossy } = require('../util/ffmpeg');
const { getCoverArt, getAlbumDesc } = require('../util/musicMetadata');

const { newTransaction } = require('../dao/main');
const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.post('/upload', ensureAuthenticatedAsAdmin, multer.single('media'), async function (req, res, next) {
    const { visibility } = req.body;
    if (!req.file) {
        next(new UserFacingError(`Uploaded file is not accepted`, 400));
    } else {
        const fileIdentifier = path.basename(req.file.path, path.extname(req.file.path));

        const t = await newTransaction();
        try {
            const { duration } = await analyseMedia(req.file.path);
            if (duration > 60 * 60) {
                return next(new UserFacingError(`Uploaded file is not accepted`, 400));
            }

            const {
                title,
                artist,
                album,
                albumArtist,
                genre,
                trackNo,
                totalTrackNo,
                discNo,
                totalDiscNo,
                composer,
                releaseYear
            } = await id3tagParser(req.file.path);

            const [_artist, ] = await Artist.findOrCreate({
                where: { name: artist || 'Unnamed Artist' },
                transaction: t
            });

            async function createAlbumArtist() {
                if (albumArtist && albumArtist !== artist) {
                    return await Artist.findOrCreate({
                        where: { name: albumArtist },
                        transaction: t
                    });
                } else {
                    return [_artist, false];
                }
            }
            const [_albumArtist, ] = await createAlbumArtist();

            const description = await getAlbumDesc(album, albumArtist ? albumArtist : artist);
            const coverImg = await getCoverArt(album, albumArtist ? albumArtist : artist);
            const [_album, ] = await Album.findOrCreate({
                where: {
                    title: album || 'Untitled',
                    artistId: _albumArtist.id
                },
                defaults: {
                    genre,
                    releaseYear,
                    releaseDate: null,
                    totalTrackNo,
                    totalDiscNo,
                    description,
                    coverImg
                },
                transaction: t
            });

            const [_song, ] = await Song.findOrCreate({
                where: {
                    title: title || 'Untitled',
                    albumId: _album.id,
                    artistId: _artist.id,
                    ownerId: process.env.ADMIN_ACCOUNT_ID
                },
                defaults: {
                    composer,
                    trackNo,
                    discNo,
                    duration,
                    fileName: req.file.originalname,
                    fileIdentifier,
                    visibility: visibility ? visibility : 1
                },
                transaction: t
            });

            // Generate an encryption key info file as per ffmpeg requirements
            const { key, keyInfo } = await generateKeyFiles(req.file.destination, fileIdentifier);

            // Transcode the media item into HLS container, and upload to cloud
            const outputFiles = await convertToHlsLossy(req.file.destination, fileIdentifier, req.file.filename, keyInfo);
            for (const file of outputFiles) {
                const { id: streamFolderId } = await getItemByPath(req.app.locals.msalClient, 'stream');
                await uploadFileToParent(req.app.locals.msalClient, file, streamFolderId);
            }

            // Upload the encryption key to cloud
            const { id: keyFolderId } = await getItemByPath(req.app.locals.msalClient, 'key');
            await uploadFileToParent(req.app.locals.msalClient, key, keyFolderId);

            // Upload the source file to cloud as backup
            const { id: sourceFolderId } = await getItemByPath(req.app.locals.msalClient, 'source');
            await uploadFileToParent(req.app.locals.msalClient, req.file.path, sourceFolderId);

            await tempFileCleaner(req.file.destination);

            await t.commit();

            res.status(200).json({
                ack: true,
                message: `Music (${_song.title}) has been uploaded`
            });
        } catch (error) {
            await t.rollback();

            await tempFileCleaner(req.file.destination);

            next(error);
        }
    }
});

router.get('/download', function (req, res) {
    res.status(200).send('Not implemented');
});

module.exports = router;
