const express = require('express');
const path = require('path');

const { parseRange, validateRange, extToMIME } = require('../lib/varStreamUtil');
const { getItemByPath, getFileByPath, getFileSliceByPath } = require('../lib/msgraph/File');
const { UserFacingError } = require('../lib/customError');

const { Song } = require('../dao/config').models;

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send('<h2>Hello, world!</h2>');
});

router.get('/user', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.status(200).json(req.user);
    } else {
        res.status(403).json({});
    }
});

router.get('/play', async function (req, res, next) {
    const { songId } = req.query;
    if (!songId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        try {
            const song = await Song.findByPk(songId);
            if (!song) {
                next(new UserFacingError(`Music of ID ${songId} does not exist`, 404));
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

module.exports = router;
