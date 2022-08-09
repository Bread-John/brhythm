const express = require('express');
const { query, validationResult } = require('express-validator');

const { UserFacingError } = require('../lib/customError');

const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/album',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 40 }),
    query('offset').if(query('offset').notEmpty()).isInt({ min: 0 }),
    function (req, res, next) {
        const { albumId, limit, offset } = req.query;
        if (albumId) {
            Album
                .findByPk(albumId, { include: [Artist], attributes: { exclude: ['createdAt', 'updatedAt'] } })
                .then(function (album) {
                    if (!album) {
                        next(new UserFacingError(`Album of ID ${albumId} does not exist`, 404));
                    } else {
                        res.status(200).json(album);
                    }
                })
                .catch(function (error) {
                    next(error);
                });
        } else if (validationResult(req).isEmpty()) {
            Album
                .findAll({
                    include: [Artist],
                    attributes: { exclude: ['description', 'createdAt', 'updatedAt'] },
                    order: [[Artist, 'name', 'ASC']],
                    limit: limit ? limit: 20,
                    offset: offset ? offset : 0
                })
                .then(function (albumSet) {
                    res.status(200).json(albumSet);
                })
                .catch(function (error) {
                    next(error);
                });
        } else {
            next(new UserFacingError(`Bad request`, 400));
        }
    }
);

router.get('/album/song', async function (req, res, next) {
    const { albumId } = req.query;
    if (!albumId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        try {
            const album = await Album.findByPk(albumId);
            if (!album) {
                next(new UserFacingError(`Album of ID ${albumId} does not exist`, 404));
            } else {
                const songSet = await album.getSongs({
                    attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'albumId', 'createdAt', 'updatedAt'] },
                    include: [Artist],
                    order: [['trackNo', 'ASC']]
                });

                res.status(200).json(songSet);
            }
        } catch (error) {
            next(error);
        }
    }
});

router.get('/artist',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 100 }),
    query('offset').if(query('offset').notEmpty()).isInt({ min: 0 }),
    function (req, res, next) {
        const { artistId, limit, offset } = req.query;
        if (artistId) {
            Artist
                .findByPk(artistId)
                .then(function (artist) {
                    if (!artist) {
                        next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404))
                    } else {
                        res.status(200).json(artist);
                    }
                })
                .catch(function (error) {
                    next(error);
                });
        } else if (validationResult(req).isEmpty()) {
            Artist
                .findAll({
                    attributes: { exclude: ['introduction'] },
                    order: [['name', 'ASC']],
                    limit: limit ? limit : 20,
                    offset: offset ? offset : 0
                })
                .then(function (artistSet) {
                    res.status(200).json(artistSet);
                })
                .catch(function (error) {
                    next(error);
                });
        } else {
            next(new UserFacingError(`Bad request`, 400));
        }
    }
);

router.get('/artist/album',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 60 }),
    query('offset').if(query('offset').notEmpty()).isInt({ min: 0 }),
    async function (req, res, next) {
        const { artistId, limit, offset } = req.query;
        if (!artistId || !validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            try {
                const artist = await Artist.findByPk(artistId, { attributes: { exclude: ['createdAt', 'updatedAt'] } });
                if (!artist) {
                    next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404));
                } else {
                    const albumSet = await artist.getAlbums({
                        attributes: { exclude: ['artistId', 'createdAt', 'updatedAt'] },
                        order: [['releaseYear', 'DESC']],
                        limit: limit ? limit: 20,
                        offset: offset ? offset : 0
                    });

                    res.status(200).json(albumSet);
                }
            } catch (error) {
                next(error);
            }
        }
    }
);

router.get('/artist/song',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 50 }),
    query('offset').if(query('offset').notEmpty()).isInt({ min: 0 }),
    async function (req, res, next) {
        const { artistId, limit, offset } = req.query;
        if (!artistId || !validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            try {
                const artist = await Artist.findByPk(artistId);
                if (!artist) {
                    next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404));
                } else {
                    const songSet = await artist.getSongs({
                        attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'artistId', 'createdAt', 'updatedAt'] },
                        include: [{ model: Album, attributes: ['id', 'title', 'coverImg'] }],
                        order: [['playCount', 'DESC']],
                        limit: limit ? limit: 10,
                        offset: offset ? offset : 0
                    });

                    res.status(200).json(songSet);
                }
            } catch (error) {
                next(error);
            }
        }
    }
);

router.get('/song',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 40 }),
    query('offset').if(query('offset').notEmpty()).isInt({ min: 0 }),
    function (req, res, next) {
        const { limit, offset } = req.query;
        if (!validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            Song
                .findAll({
                    attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
                    include: [Artist, { model: Album, attributes: ['id', 'title', 'coverImg'] }],
                    order: [['title', 'ASC']],
                    limit: limit ? limit: 10,
                    offset: offset ? offset : 0
                })
                .then(function (songSet) {
                    res.status(200).json(songSet);
                })
                .catch(function (error) {
                    next(error);
                });
        }
    }
);

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
