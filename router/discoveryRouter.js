const express = require('express');

const { UserFacingError } = require('../lib/customError');

const { Album, Artist, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/', function (req, res, next) {
    Song
        .findAll({
            include: [Artist, { model: Album, attributes: { exclude: ['artistId', 'createdAt', 'updatedAt'] } }],
            attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
            order: [['createdAt', 'DESC']],
            limit: 20
        })
        .then(function (songs) {
            res.status(200).json(songs);
        })
        .catch(function (error) {
            next(error);
        });
});

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
