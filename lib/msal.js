const msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback(level, message, containsPii) {
                if (!containsPii) {
                    switch (level) {
                        case msal.LogLevel.Error:
                            console.error(message);
                            break;
                        case msal.LogLevel.Info:
                            //console.info(message);
                            break;
                        case msal.LogLevel.Verbose:
                            //console.debug(message);
                            break;
                        case msal.LogLevel.Warning:
                            console.warn(message);
                            break;
                    }
                }
            },
            piiLoggingEnabled: false
        }
    }
};

module.exports = {
    initialize: function (app) {
        app.locals.msalClient = new msal.ConfidentialClientApplication(config);
    }
};
