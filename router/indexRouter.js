const express = require('express');
const fs = require('fs');
const nodeID3 = require('node-id3');
const path = require('path');

const multer = require('../lib/multer');
const { analyseMedia, convertToHlsLossy } = require('../lib/ffmpeg');
const { parseRange, validateRange, extToMIME } = require('../lib/varStreamUtil');
const { UserFacingError } = require('../lib/customError');
const { newTransaction } = require('../dao/main');
const { Artist, Album, Song } = require('../dao/config').models;
const { getItemByPath, getFileByPath, getFileSliceByPath, uploadFileToParent } = require('../lib/msgraph/File');

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send('<h2>Hello, world!</h2>');
});

router.get('/play', async function (req, res, next) {
    const { songId } = req.query;
    if (!songId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        try {
            const song = await Song.findByPk(songId);
            if (!song) {
                next(new UserFacingError(`Music of ID (${songId}) does not exist`, 404));
            } else {
                const { fileName, fileIdentifier, visibility, ...rest } = await Song.update({
                    playCount: song.playCount + 1
                }, {
                    where: { id: song.id },
                    returning: true
                });
                res.status(200).json(rest);
            }
        } catch (error) {
            next(error);
        }
    }
});

router.get('/stream/:resourceName', async function (req, res, next) {
    const { resourceName } = req.params;
    const [, resourceId] = resourceName.split('_');
    try {
        const song = await Song.findOne({ where: { fileIdentifier: resourceId } });
        if (!song) {
            next(new UserFacingError(`Resource does not exist`, 404));
        } else {
            const remotePath = `stream/${resourceName}`;

            const range = req.headers['range'];
            if (range) {
                getItemByPath(req.app.locals.msalClient, remotePath)
                    .then(function (info) {
                        const [start, end] = parseRange(range, info.size);
                        if (!validateRange(start, end, info.size)) {
                            next(new UserFacingError(`Requested range is not inside the size of the resource`, 416));
                        } else {
                            getFileSliceByPath(req.app.locals.msalClient, remotePath, start, end)
                                .then(function (stream) {
                                    const resHeaders = {
                                        'Accept-Ranges': `bytes`,
                                        'Content-Length': start === end ? 0 : end - start + 1,
                                        'Content-Range': `bytes ${start}-${end}/${info.size}`,
                                        'Content-Type': extToMIME(path.extname(resourceName))
                                    };
                                    res.writeHead(206, resHeaders);
                                    stream.pipe(res);
                                    stream.on('error', function (err) { next(err); });
                                    //stream.on('end', function () { res.end(); });
                                })
                                .catch(function (error) {
                                    next(error);
                                });
                        }
                    })
                    .catch(function (error) {
                        next(error);
                    });
            } else {
                getFileByPath(req.app.locals.msalClient, remotePath)
                    .then(function (stream) {
                        const resHeaders = { 'Content-Type': extToMIME(path.extname(resourceName)) };
                        res.writeHead(200, resHeaders);
                        stream.pipe(res);
                        stream.on('error', function (err) { next(err); });
                        //stream.on('end', function () { res.end(); });
                    })
                    .catch(function (error) {
                        next(error);
                    });
            }
        }
    } catch (error) {
        next(error);
    }
});

router.post('/upload', multer.single('media'), async function (req, res, next) {
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

            const outputFiles = await convertToHlsLossy(fileIdentifier, req.file.filename);
            for (const file of outputFiles) {
                const { id: folderId } = await getItemByPath(req.app.locals.msalClient, 'stream');
                const result = await uploadFileToParent(req.app.locals.msalClient, file, folderId);
                console.log(
                    `[${new Date(Date.now()).toUTCString()}] - MSGraph Info: File "${result['name']}" has been uploaded`
                );
            }
            const { id: folderId } = await getItemByPath(req.app.locals.msalClient, 'source');
            const result = await uploadFileToParent(req.app.locals.msalClient, req.file.path, folderId);
            console.log(
                `[${new Date(Date.now()).toUTCString()}] - MSGraph Info: File "${result['name']}" has been uploaded`
            );

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
                    duration: duration,
                    fileName: req.file.originalname,
                    fileIdentifier: fileIdentifier
                },
                transaction: t
            });

            await t.commit();

            res.status(200).json({
                ack: true,
                message: `Music (${artist.name} - ${song.title}) has been uploaded`
            });
        } catch (error) {
            await t.rollback();

            fs.rm(req.file.path, function (err) {
                if (err) {
                    console.error(
                        `[${new Date(Date.now()).toUTCString()}] - FileSys Error: Failed to delete file at path "${req.file.path}"`
                    );
                } else {
                    console.log(
                        `[${new Date(Date.now()).toUTCString()}] - FileSys Info: File at path "${req.file.path}" has been deleted`
                    );
                }
                next(error);
            });
        }
    }
});

module.exports = router;
