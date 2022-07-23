const express = require('express');
const { Op } = require('sequelize');

const { UserFacingError } = require('../lib/customError');

const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/', function (req, res, next) {
    Song
        .findAll({
        include: [Artist, { model: Album, attributes: { exclude: ['artistId', 'createdAt', 'updatedAt'] } }],
        attributes: { exclude: ['ownerId', 'createdAt', 'updatedAt'] },
        where: { visibility: { [Op.not]: 2 } },
        order: [[Album, 'updatedAt', 'DESC']],
        limit: 10
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
