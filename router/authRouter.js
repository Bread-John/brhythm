const express = require('express');

const { UserFacingError } = require('../lib/customError');

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
            res.redirect('/user');
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
            const userAccount = accounts.find(account => account.homeAccountId === req.session.userId);
            if (!userAccount) {
                throw new UserFacingError(`No account to be signed out`, 400);
            }
            return userAccount;
        })
        .then(function (account) {
            req.app.locals.msalClient
                .getTokenCache()
                .removeAccount(account)
                .then(function () {
                    req.session.userId = null;
                    res.redirect('/');
                })
                .catch(function (error) {
                    throw error;
                });
        })
        .catch(function (error) {
            next(error);
        });
});

module.exports = router;
