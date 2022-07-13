const express = require('express');

const { getUserDetails } = require('../lib/msgraph/User');
const { getFileById } = require("../lib/msgraph/File");

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

module.exports = router;
