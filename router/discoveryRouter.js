const express = require('express');
const { query, validationResult } = require('express-validator');

const { UserFacingError } = require('../lib/customError');

const sequelize = require('../dao/config');
const { Album, Artist, Playlist, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/popular', query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 60 }), function (req, res, next) {
    const { type, limit } = req.query;
    if (!validationResult(req).isEmpty()) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        switch (type) {
            case '1':
                Song
                    .findAll({
                        include: [Artist, {model: Album, attributes: ['title', 'releaseYear', 'coverImg']}],
                        attributes: {exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt']},
                        order: [['playCount', 'DESC']],
                        limit: limit ? limit : 10
                    })
                    .then(function (songSet) {
                        res.status(200).json(songSet);
                    })
                    .catch(function (error) {
                        next(error);
                    });
                break;
            case '3':
                Playlist
                    .findAll({
                        where: {visibility: req.isAuthenticated() ? [0, 1] : 0},
                        attributes: {exclude: ['description', 'visibility', 'creatorId']},
                        order: [['popularity', 'DESC']],
                        limit: limit ? limit : 20
                    })
                    .then(function (playlistSet) {
                        res.status(200).json(playlistSet);
                    })
                    .catch(function (error) {
                        next(error);
                    });
                break;
            default:
                next(new UserFacingError(`Bad request`, 400));
        }
    }
});

router.get('/latest', query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 60 }), function (req, res, next) {
    const { type, limit } = req.query;
    if (!validationResult(req).isEmpty()) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        switch (type) {
            case '1':
                Song
                    .findAll({
                        include: [Artist, { model: Album, attributes: ['title', 'releaseYear', 'coverImg'] }],
                        attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
                        order: [['createdAt', 'DESC']],
                        limit: limit ? limit : 10
                    })
                    .then(function (songSet) {
                        res.status(200).json(songSet);
                    })
                    .catch(function (error) {
                        next(error);
                    });
                break;
            case '2':
                Album
                    .findAll({
                        include: [Artist],
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        order: [['createdAt', 'DESC']],
                        limit: limit ? limit : 20
                    })
                    .then(function (albumSet) {
                        res.status(200).json(albumSet);
                    })
                    .catch(function (error) {
                        next(error);
                    });
                break;
            case '3':
                Playlist
                    .findAll({
                        where: { visibility: req.isAuthenticated() ? [0, 1] : 0 },
                        attributes: { exclude: ['description', 'visibility', 'creatorId'] },
                        order: [['createdAt', 'DESC']],
                        limit: limit ? limit : 20
                    })
                    .then(function (playlistSet) {
                        res.status(200).json(playlistSet);
                    })
                    .catch(function (error) {
                        next(error);
                    });
                break;
            default:
                next(new UserFacingError(`Bad request`, 400));
        }
    }
});

router.get('/random', function (req, res, next) {
    const { type } = req.query;
    switch (type) {
        case '1':
            Song
                .findAll({
                    include: [Artist, { model: Album, attributes: ['title', 'releaseYear', 'coverImg'] }],
                    attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
                    order: sequelize.random(),
                    limit: 1
                })
                .then(function (songSet) {
                    res.status(200).json(songSet[0]);
                })
                .catch(function (error) {
                    next(error);
                });
            break;
        case '2':
            Album
                .findAll({
                    include: [Artist],
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    order: sequelize.random(),
                    limit: 1
                })
                .then(function (albumSet) {
                    res.status(200).json(albumSet[0]);
                })
                .catch(function (error) {
                    next(error);
                });
            break;
        case '3':
            Playlist
                .findAll({
                    where: { visibility: req.isAuthenticated() ? [0, 1] : 0 },
                    attributes: { exclude: ['description', 'visibility', 'creatorId'] },
                    order: sequelize.random(),
                    limit: 1
                })
                .then(function (playlistSet) {
                    res.status(200).json(playlistSet[0]);
                })
                .catch(function (error) {
                    next(error);
                });
            break;
        default:
            next(new UserFacingError(`Bad request`, 400));
    }
});

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
