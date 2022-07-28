const express = require('express');

const { ensureAuthenticated } = require('../lib/passport');
const { UserFacingError } = require('../lib/customError');

const sequelize = require('../dao/config');
const { Album, Artist, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/hits', function (req, res, next) {
    Song
        .findAll({
            include: [Artist, { model: Album, attributes: ['title', 'releaseYear', 'coverImg'] }],
            attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
            order: [['playCount', 'DESC']],
            limit: 10
        })
        .then(function (songSet) {
            res.status(200).json(songSet);
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/latest', function (req, res, next) {
    const { type } = req.query;
    switch (type) {
        case '1':
            Song
                .findAll({
                    include: [Artist, { model: Album, attributes: ['title', 'releaseYear', 'coverImg'] }],
                    attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
                    order: [['createdAt', 'DESC']],
                    limit: 10
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
                    limit: 3
                })
                .then(function (albumSet) {
                    res.status(200).json(albumSet);
                })
                .catch(function (error) {
                    next(error);
                });
            break;
        default:
            next(new UserFacingError(`Bad request`, 400));
    }
});

router.get('/recommendation', ensureAuthenticated, function (req, res, next) {
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
});

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
