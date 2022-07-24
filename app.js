const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis')(session);
require('dotenv').config();

const dao = require('./dao/main');
const msal = require('./lib/msal');
const passportStrategy = require('./lib/passport');

const app = express();

app.set('trust proxy', process.env.CURRENT_ENV !== 'dev' ? 1 : false);

app.use(cors({
    'origin': process.env.TRUSTED_DOMAIN,
    'methods': ['GET', 'HEAD', 'POST'],
    'credentials': true,
    'optionsSuccessStatus': 200
}));
app.use(helmet());

dao
    .syncModels(false)
    .then(function () {
        console.log(`[${new Date(Date.now()).toUTCString()}] - DAO Info: Data Access Models successfully synced`);
    })
    .catch(function (err) {
        console.error(`[${new Date(Date.now()).toUTCString()}] - DAO ${err.name}: ${err.message}`);
        process.exit(1);
    });

let redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS
});

app.use(cookieParser());

app.use(session({
    cookie: {
        secure: process.env.CURRENT_ENV !== 'dev',
        maxAge: 86400000
    },
    name: 'brhythm-sid',
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    resave: false,
    unset: 'destroy'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());
passportStrategy.initialize(passport);

msal.initialize(app);

app.use('/', require('./router/indexRouter'));

app.use(function (err, req, res, next) {
    console.error(`[${new Date(Date.now()).toUTCString()}] - ${err.name}: ${err.message}`);
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: err.message
    });
});

module.exports = app;
