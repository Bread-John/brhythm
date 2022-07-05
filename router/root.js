const express = require('express');

const router = express.Router();

const indexCtrl = require('../controller/index');

router.get('/', indexCtrl.getIndex);

module.exports = router;
