const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(cors({
    'origin': 'http://localhost:3000',
    'methods': ['GET', 'HEAD', 'POST'],
    'credentials': true,
    'optionsSuccessStatus': 200
}));

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', require('./router/index'));

module.exports = app;
