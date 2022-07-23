const express = require('express');
const passport = require('passport');
const {UserFacingError} = require("../lib/customError");

const router = express.Router();

router.get('/signin',
    function (req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: process.env.TRUSTED_DOMAIN
        })(req, res, next);
    }, function (req, res) {
        res.redirect(`${process.env.TRUSTED_DOMAIN}/user`);
});

router.post('/callback',
    function (req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: process.env.TRUSTED_DOMAIN
        })(req, res, next);
    }, function (req, res) {
    res.redirect(`${process.env.TRUSTED_DOMAIN}/user`);
});

router.get('/signout', function (req, res, next) {
    req.session.destroy(function (error) {
        if (error) {
            next(error);
        } else {
            res.redirect(process.env.TRUSTED_DOMAIN);
        }
    })
});

router.all('*', function (req, res, next) {
    next(UserFacingError(`Could not find resource under ${req.originalUrl}`, 404));
});

module.exports = router;
