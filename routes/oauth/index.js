// routes/oauth/index.js
const express = require('express');
const router = express.Router();

const kakao = require('./kakao');
const naver = require('./naver');
const google = require('./google');

router.use('/kakao', kakao);
router.use('/naver', naver);
router.use('/google', google);

module.exports = router;
