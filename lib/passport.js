const createError = require('http-errors');
const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');

const { getUserDetails, getUserProfilePic } = require('../lib/msgraph/User');

const { User } = require('../dao/config').models;

module.exports = {
    initialise: function (app) {
        passport.use('oauth-bearer', new BearerStrategy({
            identityMetadata: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
            clientID: process.env.AAD_API_CLIENT_ID,
            passReqToCallback: true,
            isB2C: false,
            validateIssuer: true,
            scope: process.env.AAD_SCOPES.split(','),
            loggingLevel: `warn`,
            loggingNoPII: true,
            clockSkew: 180
        }, async function (req, token, done) {
            if (!process.env.AAD_TRUSTED_CLIENTS_ID.split(',').includes(token.azp)) {
                done(createError(403, `Client is not allowed`));
            } else if (!token.hasOwnProperty('scp') && !token.hasOwnProperty('roles')) {
                done(createError(403, `No delegated or application permission claims found`));
            } else {
                try {
                    const graphUser = await getUserDetails(req.app.locals.msalClient, token.oid);
                    const profileImg = await getUserProfilePic(req.app.locals.msalClient, token.oid);

                    const [user] = await User.findOrCreate({
                        where: { id: token.oid },
                        defaults: {
                            email: graphUser.userPrincipalName,
                            displayName: graphUser.displayName,
                            firstName: graphUser.givenName,
                            lastName: graphUser.surname,
                            profileImg: profileImg
                        }
                    });

                    done(null, user, token);
                } catch (error) {
                    done(error);
                }
            }
        }));

        app.use(passport.initialize());
    },
    authenticateUser: function (req, res, next) {
        passport.authenticate('oauth-bearer', {
            session: false,
            tenantIdOrName: process.env.AAD_TENANT_ID
        }, function (err, user, info) {
            if (err) {
                next(err);
            } else {
                req.authInfo = info;
                req.user = user;

                next();
            }
        })(req, res, next);
    },
    authenticateUserOrFail: function (req, res, next) {
        passport.authenticate('oauth-bearer', {
            session: false,
            tenantIdOrName: process.env.AAD_TENANT_ID
        }, function (err, user, info) {
            if (err) {
                next(err);
            } else if (!user) {
                next(createError(401, `Unauthorised`));
            } else {
                req.authInfo = info;
                req.user = user;

                next();
            }
        })(req, res, next);
    },
    authenticateAdminOrFail: function (req, res, next) {
        passport.authenticate('oauth-bearer', {
            session: false,
            tenantIdOrName: process.env.AAD_TENANT_ID
        }, function (err, user, info) {
            if (err) {
                next(err);
            } else if (!user) {
                next(createError(401, `Unauthorised`));
            } else if (user.id !== process.env.ADMIN_ACCOUNT_ID) {
                next(createError(403, `Access denied`));
            } else {
                req.authInfo = info;
                req.user = user;

                next();
            }
        })(req, res, next);
    }
};
