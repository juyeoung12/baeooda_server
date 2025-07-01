const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const verificationCodes = {}; // { email: code }

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // ex: your@gmail.com
    pass: process.env.EMAIL_PASS,
  },
});

// 이메일 전송
router.post('/send', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 숫자

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증번호',
      text: `인증번호: ${code}`,
    });

    verificationCodes[email] = code;
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('이메일 전송 실패');
  }
});

// 인증번호 확인
router.post('/verify', (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] && verificationCodes[email] === code) {
    delete verificationCodes[email];
    res.sendStatus(200);
  } else {
    res.status(400).send('인증번호가 일치하지 않습니다.');
  }
});

module.exports = router;
