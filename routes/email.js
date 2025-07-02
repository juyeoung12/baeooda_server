const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const verificationCodes = {}; // TODO: production에서는 Redis or DB 사용 추천

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 이메일 전송
router.post('/send', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증번호',
      text: `인증번호: ${code}`,
    });

    verificationCodes[email] = code;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('이메일 전송 실패:', err.message);
    res.status(500).json({ success: false, message: '이메일 전송 실패' });
  }
});

// 인증번호 확인
router.post('/verify', (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] === code) {
    delete verificationCodes[email];
    return res.status(200).json({ success: true });
  }

  res.status(400).json({ success: false, message: '인증번호가 일치하지 않습니다.' });
});

module.exports = router;
