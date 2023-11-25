const express = require('express');
const { Op } = require('sequelize');

const { UserFacingError } = require('../lib/customError');

const sequelize = require('../dao/config');
const { Album, Artist, Playlist, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/album', function (req, res, next) {
    const { q } = req.query;
    if (q.length < 2) {
        next(new UserFacingError(`Query string must be at least 2 characters long`, 400));
    } else {
        Album
            .findAll({
                attributes: ['id', 'title', 'coverImg', 'artistId'],
                where: [
                    sequelize.where(sequelize.fn('similarity', sequelize.col('title'), q), { [Op.gt]: 0.1 })
                ],
                include: [{ model: Artist, attributes: ['name'] }],
                order: [[sequelize.fn('similarity', sequelize.col('title'), q), 'DESC']]
            })
            .then(function (result) {
                res.status(200).json(result);
            })
            .catch(function (error) {
                next(error);
            });
    }
});

router.get('/artist', function (req, res, next) {
    const { q } = req.query;
    if (q.length < 2) {
        next(new UserFacingError(`Query string must be at least 2 characters long`, 400));
    } else {
        Artist
            .findAll({
                attributes: ['id', 'name', 'avatar'],
                where: [
                    sequelize.where(sequelize.fn('similarity', sequelize.col('name'), q), { [Op.gt]: 0.1 })
                ],
                order: [[sequelize.fn('similarity', sequelize.col('name'), q), 'DESC']]
            })
            .then(function (result) {
                res.status(200).json(result);
            })
            .catch(function (error) {
                next(error);
            });
    }
});

router.get('/playlist', function (req, res, next) {
    const { q } = req.query;
    if (q.length < 2) {
        next(new UserFacingError(`Query string must be at least 2 characters long`, 400));
    } else {
        Playlist
            .findAll({
                attributes: ['id', 'name', 'creatorId'],
                where: {
                    [Op.and]: [
                        sequelize.where(sequelize.fn('similarity', sequelize.col('Song.title'), q), { [Op.gt]: 0.1 }),
                        { visibility: req.isAuthenticated() ? [0, 1] : 0 }
                    ]
                },
                order: [[sequelize.fn('similarity', sequelize.col('name'), q), 'DESC']]
            })
            .then(function (result) {
                res.status(200).json(result);
            })
            .catch(function (error) {
                next(error);
            });
    }
});

router.get('/song', function (req, res, next) {
    const { q } = req.query;
    if (q.length < 2) {
        next(new UserFacingError(`Query string must be at least 2 characters long`, 400));
    } else {
        Song
            .findAll({
                attributes: ['id', 'title', 'albumId', 'artistId'],
                where: [
                    sequelize.where(sequelize.fn('similarity', sequelize.col('Song.title'), q), { [Op.gt]: 0.1 })
                ],
                include: [{ model: Artist, attributes: ['name'] }, { model: Album, attributes: ['title'] }],
                order: [[sequelize.fn('similarity', sequelize.col('Song.title'), q), 'DESC']]
            })
            .then(function (result) {
                res.status(200).json(result);
            })
            .catch(function (error) {
                next(error);
            });
    }
});

router.get('/user', function (req, res, next) {
    res.status(204).json({ error: 'Not implemented' });
});

module.exports = router;
