const express = require('express');

const { UserFacingError } = require('../lib/customError');

const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/album', function (req, res, next) {
    const { albumId } = req.query;
    if (!albumId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        Album
            .findByPk(albumId, {
                include: [{
                    model: Song,
                    include: [Artist],
                    attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] }
                }],
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            })
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
    }
});

router.get('/artist', function (req, res, next) {
    const { artistId } = req.query;
    if (!artistId) {
        next(new UserFacingError(`Bad request`, 400));
    } else {
        Artist
            .findByPk(artistId, { attributes: { exclude: ['createdAt', 'updatedAt'] } })
            .then(function (artist) {
                if (!artist) {
                    next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404));
                } else {
                    res.status(200).json(artist);
                }
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
                const albums = await artist.getAlbums({
                    attributes: { exclude: ['artistId', 'createdAt', 'updatedAt'] },
                    order: [['releaseYear', 'DESC']],
                    limit: limit && limit <= 40 ? limit: 20,
                    offset: offset ? offset : 0
                });

                res.status(200).json(albums);
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
            const artist = await Artist.findByPk(artistId, { attributes: { exclude: ['createdAt', 'updatedAt'] } });
            if (!artist) {
                next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404));
            } else {
                const songs = await artist.getSongs({
                    attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'artistId', 'createdAt', 'updatedAt'] },
                    include: [{ model: Album, attributes: ['title', 'releaseYear', 'coverImg'] }],
                    order: [['playCount', 'DESC']],
                    limit: limit && limit <= 100 ? limit: 10,
                    offset: offset ? offset : 0
                });

                res.status(200).json(songs);
            }
        } catch (error) {
            next(error);
        }
    }
});

router.all('*', function (req, res, next) {
    next(new UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
