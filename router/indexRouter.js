const express = require('express');
const path = require('path');

const { ensureAuthenticated } = require('../lib/passport');
const { getItemByPath, getFileByPath, getFileSliceByPath } = require('../lib/msgraph/File');
const { UserFacingError, ApplicationError} = require('../lib/customError');
const { generateAuthToken, verifyAuthToken } = require('../util/playbackToken');
const { parseRange, validateRange, extToMIME } = require('../util/resHeaders');

const { Album, Artist, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/', function (req, res) {
    res.status(418).json({ message: 'Could not brew coffee with a teapot 🫖' });
});

router.get('/user', ensureAuthenticated, function (req, res, next) {
    res.status(200).json(req.user);
});

router.get('/play', async function (req, res, next) {
    const { songId } = req.query;
    if (!songId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        try {
            const song = await Song.findByPk(songId, { include: [Album, Artist] });
            if (!song) {
                next(new UserFacingError(`Music of ID ${songId} does not exist`, 404));
            } else {
                await Song.update({ playCount: song.playCount + 1 }, { where: { id: song.id } });

                const songInfo = {
                    title: song.title,
                    artist: { id: song.Artist.id, name: song.Artist.name },
                    album: { id: song.Album.id, title: song.Album.title, coverArt: song.Album.coverImg },
                    duration: song.duration
                };

                const tokenExpiration = Math.floor(song.duration) + 5;
                generateAuthToken({ fileIdentifier: song.fileIdentifier }, tokenExpiration)
                    .then(function (token) {
                        res
                            .status(200)
                            .cookie('media-access', token, { httpOnly: true, maxAge: tokenExpiration * 1000 })
                            .json({
                                mediaInfo: songInfo,
                                res: [{
                                    url: `${process.env.HOSTNAME}/stream/brhythm_${song.fileIdentifier}_hq_aac_index.m3u8`,
                                    token: token
                                }]
                            });
                    })
                    .catch(function (error) {
                        console.error(
                            `[${new Date(Date.now()).toUTCString()}] - ${error.name}: ${error.message}`
                        );
                        next(new ApplicationError(`Failed to generate media authorization token`));
                    });
            }
        } catch (error) {
            next(error);
        }
    }
});

router.get('/stream/:resourceName', async function (req, res, next) {
    const { resourceName } = req.params;
    const [, resourceId] = resourceName.split('_');
    const token = req.cookies['media-access'];

    if (!token) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        verifyAuthToken(token)
            .then(function (payload) {
                if (payload.fileIdentifier !== resourceId) {
                    next(new UserFacingError(`Access to resource ${resourceName} is not authorized`, 403));
                } else {
                    const remotePath = `stream/${resourceName}`;

                    const range = req.headers['range'];
                    if (range) {
                        getItemByPath(req.app.locals.msalClient, remotePath)
                            .then(function (info) {
                                const [start, end] = parseRange(range, info.size);
                                if (!validateRange(start, end, info.size)) {
                                    next(new UserFacingError(`Requested range is not inside the resource size`, 416));
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
                                            stream.on('end', function () { res.end(); });
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
                                stream.on('end', function () { res.end(); });
                            })
                            .catch(function (error) {
                                next(error);
                            });
                    }
                }
            })
            .catch(function (error) {
                if (error.name === 'TokenExpiredError') {
                    next(new UserFacingError(`Provided access token has expired`, 401));
                } else {
                    console.error(
                        `[${new Date(Date.now()).toUTCString()}] - ${error.name}: ${error.message}`
                    );
                    next(new ApplicationError(`Failed to verify media authorization token`));
                }
            });
    }
});

router.use('/artwork', require('./artworkRouter'));
router.use('/auth', require('./authRouter'));
router.use('/management', require('./mgmtRouter'));

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
