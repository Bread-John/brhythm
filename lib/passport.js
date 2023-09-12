const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');

const { getUserDetails, getUserProfilePic } = require('../lib/msgraph/User');

const { User } = require('../dao/config').models;

module.exports = {
    initialise: function (app) {
        app.use(passport.initialize());

        passport.use(new BearerStrategy({
            identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
            clientID: process.env.CLIENT_ID,
            passReqToCallback: true,
            isB2C: false,
            validateIssuer: true,
            scope: process.env.SCOPES.split(','),
            loggingLevel: `warn`,
            loggingNoPII: true,
            clockSkew: 180
        }, function (req, token, done) {
            getUserDetails(req.app.locals.msalClient, token.oid)
                .then(function (_user) {
                    getUserProfilePic(req.app.locals.msalClient, token.oid)
                        .then(function (profileImg) {
                            User
                                .findOrCreate({
                                    where: { id: token.oid },
                                    defaults: {
                                        email: _user.userPrincipalName,
                                        displayName: _user.displayName,
                                        firstName: _user.givenName,
                                        lastName: _user.surname,
                                        profileImg: profileImg
                                    }
                                })
                                .then(function ([user, ]) {
                                    done(null, user, token);
                                })
                                .catch(function (error) {
                                    done(error);
                                });
                        })
                        .catch(function (error) {
                            done(error);
                        });
                })
                .catch(function (error) {
                    done(error);
                });
        }));

        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function (oid, done) {
            User
                .findByPk(oid, { attributes: { exclude: ['isSuspended', 'createdAt', 'updatedAt'] } })
                .then(function (user) {
                    done(null, user);
                })
                .catch(function (error) {
                    done(error);
                });
        });
    },
    authenticateUser: function (req, res, next) {
        passport.authenticate(`oauth-bearer`, {
            session: false,
            tenantIdOrName: process.env.TENANT_ID
        }, function (err, user, info) {
            if (err) {
                res.status(401).json({ error: err.message });
            } else if (!user) {
                res.status(401).json({ error: 'Unauthorized' });
            } else if (info) {
                req.authInfo = info;
                next();
            }
        })(req, res, next);
    },
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.status(401).json({ error: 'Unauthorised request' });
        }
    },
    ensureAuthenticatedAsAdmin: function (req, res, next) {
        if (req.isAuthenticated() && req.user.id === process.env.ADMIN_ACCOUNT_ID) {
            next();
        } else {
            res.status(401).json({ error: 'Admin permission required' });
        }
    }
};
