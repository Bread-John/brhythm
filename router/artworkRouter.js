const express = require('express');
const {UserFacingError} = require("../lib/customError");

const router = express.Router();

router.get('/', function (req, res, next) {
    console.log();
});

router.all('*', function (req, res, next) {
    next(UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
