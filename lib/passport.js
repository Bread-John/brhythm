const { OIDCStrategy } = require('passport-azure-ad');

const { ApplicationError } = require('../lib/customError');
const { getUserDetails, getUserProfilePic } = require('../lib/msgraph/User');

const { User } = require('../dao/config').models;

module.exports = {
    initialize: function (passport) {
        passport.use(new OIDCStrategy({
            identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
            clientID: process.env.CLIENT_ID,
            responseType: 'id_token',
            responseMode: 'form_post',
            redirectUrl: `${process.env.API_DOMAIN}/auth/callback`,
            passReqToCallback: true,
            allowHttpForRedirectUrl: process.env.CURRENT_ENV === 'dev',
            clientSecret: process.env.CLIENT_SECRET,
            isB2C: false,
            validateIssuer: true,
            scope: process.env.SCOPES.split(','),
            loggingLevel: 'warn',
            loggingNoPII: true,
            useCookieInsteadOfSession: false
        }, function (req, iss, sub, profile, done) {
            if (!profile.oid) {
                return done(new ApplicationError('OpenID has not been properly set'));
            }

            getUserDetails(req.app.locals.msalClient, profile.oid)
                .then(function (_user) {
                    getUserProfilePic(req.app.locals.msalClient, profile.oid)
                        .then(function (profileImg) {
                            User
                                .findOrCreate({
                                    where: { id: profile.oid },
                                    defaults: {
                                        email: _user.userPrincipalName,
                                        displayName: _user.displayName,
                                        firstName: _user.givenName,
                                        lastName: _user.surname,
                                        profileImg: profileImg
                                    }
                                })
                                .then(function ([user, ]) {
                                    done(null, user);
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
