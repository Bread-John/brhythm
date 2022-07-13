const express = require('express');

const router = express.Router();

router.get('/download', function (req, res, next) {
    res.status(200).send('');
});

module.exports = router;
