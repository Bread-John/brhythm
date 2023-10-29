require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const createError = require('http-errors');
//const Redis = require('ioredis');

const msal = require('./lib/msal');
const passport = require('./lib/passport');

const app = express();

app.set('trust proxy', process.env.CURRENT_ENV !== 'dev' ? 1 : false);

app.use(cors({
    'origin': process.env.TRUSTED_DOMAIN,
    'methods': ['GET', 'HEAD', 'POST'],
    'credentials': true,
    'optionsSuccessStatus': 200
}));

app.use(helmet());

/*const redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS
});*/

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

msal.initialise(app);

passport.initialise(app);

app.use('/', require('./router/indexRouter'));

app.use(function (req, res, next) {
    next(createError(404, `Could not ${req.method} resource '${req.originalUrl}'`));
});

app.use(function (err, req, res, next) {
    console.error(`[${new Date(Date.now()).toUTCString()}] - ${err.name}: ${err.message}`);
    console.error(err.stack);

    res.status(err.statusCode || 500).json({
        error: err.message
    });
});

module.exports = app;
