const express = require('express');
const fs = require('fs');

const { getUserDetails } = require('../lib/msgraph/User');
const { getFileById } = require("../lib/msgraph/File");
const { UserFacingError } = require("../lib/customError");

const router = express.Router();

router.get('/', function (req, res, next) {
    res.status(200).send('<h2>Hello, world!</h2>');
});

router.get('/user', function (req, res, next) {
    getUserDetails(req.app.locals.msalClient, req.session.userId.split('.')[0])
        .then(function (response) {
            res.status(200).json(response);
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/stream', function (req, res, next) {
    getFileById(req.app.locals.msalClient, '01RJNJU2VUEQCT2FUYFJGJSLAEDURVUXJH')
        .then(function (response) {
            res.redirect(response);
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/serve/:resourceId/:resourceName', function (req, res, next) {
    const { resourceId, resourceName } = req.params;

    const filePath = `${process.env.TEMP_FILES_PATH}/${resourceId}/${resourceName}`;
    fs.access(filePath, fs.constants.F_OK, function (err) {
        if (err) {
            next(new UserFacingError(`Resource not found`, 404));
        } else {
            const stream = fs.createReadStream(filePath);
            stream.on('error', err => next(err));
            stream.on('end', () => res.end());
            stream.pipe(res);
        }
    });
});

module.exports = router;
