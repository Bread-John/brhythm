const express = require('express');

const router = express.Router();

router.get('/signin', function (req, res, next) {
    const options = {
        scopes: process.env.SCOPES.split(','),
        redirectUri: `${process.env.HOSTNAME}/auth/callback`
    };

    req.app.locals.msalClient
        .getAuthCodeUrl(options)
        .then(function (authUrl) {
            res.redirect(authUrl);
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/callback', function (req, res, next) {
    const tokenRequest = {
        code: req.query.code,
        scopes: process.env.SCOPES.split(','),
        redirectUri: `${process.env.HOSTNAME}/auth/callback`
    };

    req.app.locals.msalClient
        .acquireTokenByCode(tokenRequest)
        .then(function (response) {
            req.session.userId = response.account.homeAccountId;
            res.redirect('/');
        })
        .catch(function (error) {
            next(error);
        });
});

router.get('/signout', function (req, res, next) {
    req.app.locals.msalClient
        .getTokenCache()
        .getAllAccounts()
        .then(function (accounts) {
            const userAccount = accounts.find(a => a.homeAccountId === req.session.userId);
            if (userAccount) {
                req.app.locals.msalClient
                    .getTokenCache()
                    .removeAccount(userAccount)
                    .then(function () {
                        req.session.userId = null;
                        res.redirect('/');
                    })
                    .catch(function (error) {
                        throw error;
                    });
            }
        })
        .catch(function (error) {
            next(error);
        });
});

module.exports = router;
