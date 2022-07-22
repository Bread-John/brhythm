const express = require('express');

const passport = require('../lib/passport');

const router = express.Router();

router.get('/signin',
    function (req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: '/'
        })(req, res, next);
    }, function (req, res) {
        res.redirect('/');
});

router.post('/callback',
    function (req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: '/'
        })(req, res, next);
    }, function (req, res) {
    res.redirect('/');
});

router.get('/signout', function (req, res, next) {
    req.session.destroy(function (error) {
        if (error) {
            next(error);
        } else {
            res.redirect('/');
        }
    })
});

module.exports = router;
