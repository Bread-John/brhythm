const express = require('express');
const { body, query, validationResult } = require('express-validator');

const { ensureAuthenticated } = require('../lib/passport');
const { UserFacingError } = require('../lib/customError');

const { newTransaction } = require('../dao/main');
const { Album, Artist, Playlist, PlaylistSong, Song, User } = require('../dao/config').models;

const router = express.Router();

router.get('/',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 40 }),
    query('offset').if(query('offset').notEmpty()).isInt({ min: 0 }),
    async function (req, res, next) {
        const { playlistId, limit, offset } = req.query;
        if (playlistId) {
            try {
                const playlist = await Playlist.findByPk(playlistId, {
                    include: [{
                        model: Song,
                        through: { attributes: [] },
                        include: [
                            { model: Album, attributes: ['id', 'title', 'coverImg'] },
                            { model: Artist, attributes: ['id', 'name'] }
                        ],
                        attributes: ['id', 'title', 'duration', 'isExplicit', 'allowDownload']
                    }, {
                        model: User,
                        attributes: ['id', 'displayName', 'profileImg']
                    }],
                    attributes: { exclude: ['creatorId'] },
                    order: [[Song, PlaylistSong, 'createdAt']]
                });
                if (!playlist) {
                    next(new UserFacingError(`Playlist of ID ${playlistId} does not exist`, 404));
                } else if (playlist.visibility === 1 && !req.isAuthenticated()) {
                    next(new UserFacingError(`Access to playlist of ID ${playlistId} is restricted to organisation users only`, 403));
                } else if (playlist.visibility === 2 && playlist.creatorId !== req.user.id) {
                    // Not disclose any information on private playlists
                    next(new UserFacingError(`Playlist of ID ${playlistId} does not exist`, 404));
                } else {
                    res.status(200).json(playlist);
                }
            } catch (error) {
                next(error);
            }
        } else if (validationResult(req).isEmpty()) {
            Playlist
                .findAll({
                    where: { visibility: req.isAuthenticated() ? [0, 1] : 0 },
                    attributes: { exclude: ['description', 'visibility', 'creatorId'] },
                    order: [['updatedAt', 'DESC']],
                    limit: limit ? limit : 20,
                    offset: offset ? offset : 0
                })
                .then(function (playlistSet) {
                    res.status(200).json(playlistSet);
                })
                .catch(function (error) {
                    next(error);
                });
        } else {
            next(new UserFacingError(`Bad request`, 400));
        }
    }
);

router.post('/create',
    ensureAuthenticated,
    body('name').isLength({ min: 2, max: 50 }),
    body('description').isLength({ max: 300 }),
    body('visibility').matches(/^[0-2]$/),
    function (req, res, next) {
        const { name, description, coverImg, visibility } = req.body;
        if (!validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            Playlist
                .create({
                    name: name,
                    description: description,
                    coverImg: coverImg,
                    visibility: visibility,
                    creatorId: '06ba267e-06b2-4517-b26e-d8cb9acb9ffd'
                })
                .then(function (playlist) {
                    res.status(201).json({ message: `Playlist (${playlist.name}) has been created` });
                })
                .catch(function (error) {
                    next(error);
                });
        }
    }
);

router.post('/edit',
    ensureAuthenticated,
    body('playlistId').notEmpty(),
    body('name').if(body('name').notEmpty()).isLength({ min: 2, max: 50 }),
    body('description').isLength({ max: 300 }),
    body('visibility').if(body('visibility').notEmpty()).matches(/^[0-2]$/),
    function (req, res, next) {
        const { playlistId, name, description, coverImg, visibility } = req.body;
        if (!validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            Playlist
                .findByPk(playlistId)
                .then(function (playlist) {
                    if (!playlist) {
                        next(new UserFacingError(`Playlist of ID ${playlistId} does not exist`, 404));
                    } else if (playlist.creatorId !== req.user.id) {
                        next(new UserFacingError(`Playlists created by others cannot be modified`, 400));
                    } else {
                        playlist.name = name ? name : playlist.name;
                        playlist.description = description ? description : playlist.description;
                        playlist.coverImg = coverImg ? coverImg : playlist.coverImg;
                        playlist.visibility = visibility ? visibility : playlist.visibility;
                        playlist
                            .save()
                            .then(function () {
                                res.status(200).json({ message: `Playlist (${playlist.name}) has been modified` });
                            })
                            .catch(function (error) {
                                next(error);
                            });
                    }
                })
                .catch(function (error) {
                    next(error);
                });
        }
    }
);

router.post('/delete', ensureAuthenticated, function (req, res, next) {
    const { playlistId } = req.body;
    if (!playlistId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        Playlist
            .findByPk(playlistId)
            .then(function (playlist) {
                if (!playlist) {
                    next(new UserFacingError(`Playlist of ID ${playlistId} does not exist`, 404));
                } else if (playlist.creatorId !== req.user.id) {
                    next(new UserFacingError(`Playlists created by others cannot be deleted`, 400));
                } else {
                    Playlist
                        .destroy({ where: { id: playlistId } })
                        .then(function () {
                            res.status(200).json({ message: `Playlist (${playlist.name}) has been permanently deleted` });
                        })
                        .catch(function (error) {
                            next(error);
                        });
                }
            })
            .catch(function (error) {
                next(error);
            });
    }
});

router.post('/add', ensureAuthenticated, async function (req, res, next) {
    const { playlistId, songId } = req.body;
    if (!playlistId || !songId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        const t = await newTransaction();
        try {
            const playlist = await Playlist.findByPk(playlistId);
            const song = await Song.findByPk(songId);
            if (!playlist) {
                next(new UserFacingError(`Playlist of ID ${playlistId} does not exist`, 404));
            } else if (!song) {
                next(new UserFacingError(`Music of ID ${songId} does not exist`, 404));
            } else if (playlist.creatorId !== req.user.id) {
                next(new UserFacingError(`Adding items to playlists created by others is not allowed`, 400));
            } else {
                await Playlist.increment('itemCount', { where: { id: playlistId }, transaction: t });
                await playlist.addSong(song, { transaction: t });

                await t.commit();

                res.status(200).json({ message: `Music (${song.title}) has been added to playlist (${playlist.name})` });
            }
        } catch (error) {
            await t.rollback();

            next(error);
        }
    }
});

router.post('/remove', ensureAuthenticated, async function (req, res, next) {
    const { playlistId, songId } = req.body;
    if (!playlistId || !songId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        const t = await newTransaction();
        try {
            const playlist = await Playlist.findByPk(playlistId);
            const song = await Song.findByPk(songId);
            if (!playlist) {
                next(new UserFacingError(`Playlist of ID ${playlistId} does not exist`, 404));
            } else if (!song) {
                next(new UserFacingError(`Music of ID ${songId} does not exist`, 404));
            } else if (playlist.creatorId !== req.user.id) {
                next(new UserFacingError(`Removing items from playlists created by others is not allowed`, 400));
            } else {
                await Playlist.decrement('itemCount', { where: { id: playlistId }, transaction: t });
                await playlist.removeSong(song, { transaction: t });

                await t.commit();

                res.status(200).json({ message: `Music (${song.title}) has been removed from playlist (${playlist.name})` });
            }
        } catch (error) {
            await t.rollback();

            next(error);
        }
    }
});

module.exports = router;
