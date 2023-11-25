const express = require('express');
const { query, validationResult } = require('express-validator');

const { UserFacingError } = require('../lib/customError');

const { Artist, Album, Song } = require('../dao/config').models;

const router = express.Router();

router.get('/album',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 40 }),
    query('page').if(query('page').notEmpty()).isInt({ min: 1 }),
    async function (req, res, next) {
        const { albumId } = req.query;
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
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const page = req.query.page ? parseInt(req.query.page) : 1;

            try {
                const pageCount = Math.ceil(await Album.count() / limit) || 1;
                if (page > pageCount) {
                    next(new UserFacingError(`Bad request`, 400));
                } else {
                    const albumSet = await Album.findAll({
                        include: [Artist],
                        attributes: { exclude: ['description', 'createdAt', 'updatedAt'] },
                        order: [[Artist, 'name', 'ASC']],
                        limit: limit,
                        offset: limit * (page - 1)
                    });

                    res.status(200).json({
                        albumSet: albumSet,
                        currentPage: page,
                        totalPages: pageCount,
                        links: {
                            prevPage: page !== 1 ? `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${page - 1}` : '',
                            nextPage: page !== pageCount ? `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${page + 1}` : '',
                            firstPage: `${req.originalUrl.split('?')[0]}?limit=${limit}&page=1`,
                            lastPage: `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${pageCount}`
                        }
                    });
                }
            } catch (error) {
                next(error);
            }
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
    query('page').if(query('page').notEmpty()).isInt({ min: 1 }),
    async function (req, res, next) {
        const { artistId } = req.query;
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
            const limit = req.query.limit ? parseInt(req.query.limit) : 40;
            const page = req.query.page ? parseInt(req.query.page) : 1;

            try {
                const pageCount = Math.ceil(await Artist.count() / limit) || 1;
                if (page > pageCount) {
                    next(new UserFacingError(`Bad request`, 400));
                } else {
                    const artistSet = await Artist.findAll({
                        attributes: { exclude: ['introduction'] },
                        order: [['name', 'ASC']],
                        limit: limit,
                        offset: limit * (page - 1)
                    });

                    res.status(200).json({
                        artistSet: artistSet,
                        currentPage: page,
                        totalPages: pageCount,
                        links: {
                            prevPage: page !== 1 ? `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${page - 1}` : '',
                            nextPage: page !== pageCount ? `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${page + 1}` : '',
                            firstPage: `${req.originalUrl.split('?')[0]}?limit=${limit}&page=1`,
                            lastPage: `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${pageCount}`
                        }
                    });
                }
            } catch (error) {
                next(error);
            }
        } else {
            next(new UserFacingError(`Bad request`, 400));
        }
    }
);

router.get('/artist/album',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 60 }),
    query('page').if(query('page').notEmpty()).isInt({ min: 1 }),
    async function (req, res, next) {
        const { artistId } = req.query;
        if (!artistId || !validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const page = req.query.page ? parseInt(req.query.page) : 1;

            try {
                const artist = await Artist.findByPk(artistId, { attributes: { exclude: ['createdAt', 'updatedAt'] } });
                if (!artist) {
                    next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404));
                } else {
                    const pageCount = Math.ceil(await Album.count({ where: { artistId: artistId } }) / limit) || 1;
                    if (page > pageCount) {
                        next(new UserFacingError(`Bad request`, 400));
                    } else {
                        const albumSet = await artist.getAlbums({
                            attributes: { exclude: ['artistId', 'createdAt', 'updatedAt'] },
                            order: [['releaseYear', 'DESC']],
                            limit: limit,
                            offset: limit * (page - 1)
                        });

                        res.status(200).json({
                            albumSet: albumSet,
                            currentPage: page,
                            totalPages: pageCount,
                            links: {
                                prevPage: page !== 1 ? `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=${page - 1}` : '',
                                nextPage: page !== pageCount ? `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=${page + 1}` : '',
                                firstPage: `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=1`,
                                lastPage: `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=${pageCount}`
                            }
                        });
                    }
                }
            } catch (error) {
                next(error);
            }
        }
    }
);

router.get('/artist/song',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 50 }),
    query('page').if(query('page').notEmpty()).isInt({ min: 1 }),
    async function (req, res, next) {
        const { artistId } = req.query;
        if (!artistId || !validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const page = req.query.page ? parseInt(req.query.page) : 1;

            try {
                const artist = await Artist.findByPk(artistId);
                if (!artist) {
                    next(new UserFacingError(`Artist of ID ${artistId} does not exist`, 404));
                } else {
                    const pageCount = Math.ceil(await Song.count({ where: { artistId: artistId } }) / limit) || 1;
                    if (page > pageCount) {
                        next(new UserFacingError(`Bad request`, 400));
                    } else {
                        const songSet = await artist.getSongs({
                            attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'artistId', 'createdAt', 'updatedAt'] },
                            include: [{ model: Album, attributes: ['id', 'title', 'coverImg'] }],
                            order: [['playCount', 'DESC']],
                            limit: limit,
                            offset: limit * (page - 1)
                        });

                        res.status(200).json({
                            songSet: songSet,
                            currentPage: page,
                            totalPages: pageCount,
                            links: {
                                prevPage: page !== 1 ? `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=${page - 1}` : '',
                                nextPage: page !== pageCount ? `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=${page + 1}` : '',
                                firstPage: `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=1`,
                                lastPage: `${req.originalUrl.split('?')[0]}?artistId=${artistId}&limit=${limit}&page=${pageCount}`
                            }
                        });
                    }
                }
            } catch (error) {
                next(error);
            }
        }
    }
);

router.get('/song',
    query('limit').if(query('limit').notEmpty()).isInt({ min: 1, max: 40 }),
    query('page').if(query('page').notEmpty()).isInt({ min: 1 }),
    async function (req, res, next) {
        if (!validationResult(req).isEmpty()) {
            next(new UserFacingError(`Bad request`, 400));
        } else {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const page = req.query.page ? parseInt(req.query.page) : 1;

            try {
                const pageCount = Math.ceil(await Song.count() / limit) || 1;
                if (page > pageCount) {
                    next(new UserFacingError(`Bad request`, 400));
                } else {
                    const songSet = await Song.findAll({
                        attributes: { exclude: ['fileName', 'fileIdentifier', 'extIdentifier', 'ownerId', 'createdAt', 'updatedAt'] },
                        include: [Artist, { model: Album, attributes: ['id', 'title', 'coverImg'] }],
                        order: [['createdAt', 'DESC']],
                        limit: limit,
                        offset: limit * (page - 1)
                    });

                    res.status(200).json({
                        songSet: songSet,
                        currentPage: page,
                        totalPages: pageCount,
                        links: {
                            prevPage: page !== 1 ? `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${page - 1}` : '',
                            nextPage: page !== pageCount ? `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${page + 1}` : '',
                            firstPage: `${req.originalUrl.split('?')[0]}?limit=${limit}&page=1`,
                            lastPage: `${req.originalUrl.split('?')[0]}?limit=${limit}&page=${pageCount}`
                        }
                    });
                }
            } catch (error) {
                next(error);
            }
        }
    }
);

module.exports = router;
