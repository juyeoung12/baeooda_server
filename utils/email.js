const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ 인증번호 저장용 (간단한 메모리 저장 방식)
const verificationCodes = {};

// ✅ Gmail 전송 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ 인증번호 전송 라우트
router.post('/send', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000); // 6자리 숫자

  console.log('📨 이메일 전송 시도 - 현재 html 형식 사용 중');

  try {
      await transporter.sendMail({
        from: `"배우다 인증센터" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '[배우다] 이메일 인증번호 안내',
        html: `
          <div style="padding: 20px; font-size: 16px; color: #333;">
            <h2 style="color: #d04444;">🔐 이메일 인증</h2>
            <p>아래 인증번호를 입력해주세요:</p>
            <div style="font-size: 24px; font-weight: bold; margin-top: 10px;">
              ${code}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
              ※ 본 메일은 발신 전용입니다.
            </p>
          </div>
        `
        // ❌ text 속성 절대 넣지 마세요!!
      });


    verificationCodes[email] = code;
    console.log(`✅ ${email} 에게 보낸 인증번호: ${code}`);
    res.status(200).json({ message: '인증번호 전송 완료' });
  } catch (err) {
    console.error('❌ 이메일 전송 실패:', err);
    res.status(500).json({ message: '이메일 전송 실패' });
  }
});

// ✅ 인증번호 검증 라우트
router.post('/verify', (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] && verificationCodes[email] == code) {
    delete verificationCodes[email]; // 일회성 코드이므로 삭제
    return res.status(200).json({ message: '인증 성공' });
  }

  return res.status(400).json({ message: '인증 실패' });
});

module.exports = router;
