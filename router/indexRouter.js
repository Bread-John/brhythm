const express = require('express');
const fs = require('fs');
const nodeID3 = require('node-id3');

const fileUpload = require('../lib/fileUploads');
const { convertToHlsLossy } = require('../lib/ffmpeg');
const { UserFacingError } = require('../lib/customError');
const { newTransaction } = require('../dao/main');
const { Artist, Album, Song } = require('../dao/config').models;
const { getUserDetails } = require('../lib/msgraph/User');
const { getFileByPath, createFolder, uploadFile } = require('../lib/msgraph/File');

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send('<h2>Hello, world!</h2>');
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

router.get('/play', async function (req, res, next) {
    const { title } = req.query;
    if (!title) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        const t = newTransaction();
        try {
            const song = await Song.findOne({ where: { title: title } });
            if (song) {
                await Song.update({ playCount: song.playCount + 1 }, { where: { id: song.id } });
                res.status(200).json(song);
            } else {
                res.status(200).json({});
            }

            await t.commit();
        } catch (error) {
            await t.rollback();

            next(error);
        }
    }
});

router.get('/stream/:resourceId/:resourceName', function (req, res, next) {
    const { resourceId, resourceName } = req.params;

    getFileByPath(req.app.locals.msalClient, resourceId, resourceName)
        .then(function (stream) {
            stream.on('error', function (err) { next(err); });
            stream.on('end', function () { res.end(); });
            stream.pipe(res);
        })
        .catch(function (error) {
            next(error);
        });
});

router.post('/upload', fileUpload.single('media'), async function (req, res, next) {
    if (!req.file) {
        next(new UserFacingError(`Uploaded file is not accepted`, 400));
    } else {
        const folderIdentifier = req.file.destination.split('/').at(-1);

        // Details on these tag names are here: https://github.com/Zazama/node-id3#supported-raw-ids
        const {
            TIT2, TPE1, TALB, TPE2, TCON,
            TRCK, TPOS, TCOM, TYER, TPUB,
            APIC
        } = nodeID3.read(req.file.path, { onlyRaw: true });
        const imageBuffer = APIC ? APIC.imageBuffer : undefined;
        const [trackNo, totalTrackNo] = TRCK ? TRCK.split('/') : [];
        const [discNo, totalDiscNo] = TPOS ? TPOS.split('/') : [];

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
                    fileName: req.file.originalname,
                    fileLocation: `BrhythmFiles/${folderIdentifier}`
                },
                transaction: t
            });

            await convertToHlsLossy(req.file.destination, req.file.filename)
                .then(function () {
                    createFolder(req.app.locals.msalClient, folderIdentifier)
                        .then(function (folder) {
                            fs.readdir(req.file.destination, function (err, files) {
                                if (err) throw err;
                                for (const file of files) {
                                    uploadFile(
                                        req.app.locals.msalClient,
                                        `${req.file.destination}/${file}`,
                                        file,
                                        folder.id
                                    )
                                        .then(function (result) {
                                            if (result) {
                                                console.log(
                                                    `[${new Date(Date.now()).toUTCString()}] - OneDrive Info: File "${file}" has been uploaded`
                                                );
                                                fs.rm(`${req.file.destination}/${file}`, function (err) {
                                                    if (err) throw err;
                                                    console.log(
                                                        `[${new Date(Date.now()).toUTCString()}] - FileSys Info: Local copy of File "${file}" has been deleted`
                                                    );
                                                });
                                            }
                                        })
                                        .catch(function (error) {
                                            throw error;
                                        });
                                }
                            });
                        })
                        .catch(function (error) {
                            throw error;
                        });
                })
                .catch(function (error) {
                    throw error;
                });

            await t.commit();

            res.status(200).json({
                message: `Music ( ${artist.name} - ${song.title} ) has been uploaded`
            });
        } catch (error) {
            await t.rollback();

            fs.rm(req.file.destination, { recursive: true, force: true }, function () {
                console.log(
                    `[${new Date(Date.now()).toUTCString()}] - FileSys Info: Temp Folder "${req.file.destination}" has been cleaned up`
                );
                next(error);
            });
        }
    }
});

module.exports = router;
