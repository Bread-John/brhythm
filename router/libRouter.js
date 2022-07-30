const express = require('express');

const { UserFacingError } = require('../lib/customError');

const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/album', function (req, res, next) {
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
    } else {
        Album
            .findAll({
                include: [Artist],
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                limit: limit && limit <= 40 ? limit: 20,
                offset: offset ? offset : 0
            })
            .then(function (albumSet) {
                res.status(200).json(albumSet);
            })
            .catch(function (error) {
                next(error);
            });
    }
});

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

router.get('/artist', function (req, res, next) {
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
    } else {
        Artist
            .findAll({ limit: limit && limit <= 80 ? limit : 20, offset: offset ? offset : 0 })
            .then(function (artistSet) {
                res.status(200).json(artistSet);
            })
            .catch(function (error) {
                next(error);
            });
    }
});

router.get('/artist/album', async function (req, res, next) {
    const { artistId, limit, offset } = req.query;
    if (!artistId) {
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
                    limit: limit && limit <= 40 ? limit: 20,
                    offset: offset ? offset : 0
                });

                res.status(200).json(albumSet);
            }
        } catch (error) {
            next(error);
        }
    }
});

router.get('/artist/song', async function (req, res, next) {
    const { artistId, limit, offset } = req.query;
    if (!artistId) {
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
                    limit: limit && limit <= 100 ? limit: 10,
                    offset: offset ? offset : 0
                });

                res.status(200).json(songSet);
            }
        } catch (error) {
            next(error);
        }
    }
});

router.get('/song', async function (req, res, next) {
    const { limit, offset } = req.query;
    Song
        .findAll({
            attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
            include: [Artist, { model: Album, attributes: ['id', 'title', 'coverImg'] }],
            order: [['title', 'ASC']],
            limit: limit && limit <= 100 ? limit: 50,
            offset: offset ? offset : 0
        })
        .then(function (songSet) {
            res.status(200).json(songSet);
        })
        .catch(function (error) {
            next(error);
        });
});

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
