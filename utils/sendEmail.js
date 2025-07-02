const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, tempPassword) => {
  const mailOptions = {
    from: `"배우다 고객센터" <${process.env.EMAIL_USER}>`, // 발신자
    to,                                                  // 수신자
    subject: '🔒 임시 비밀번호 안내',                  // 제목
    html: `
      <p>안녕하세요, <strong>배우다</strong>입니다.</p>
      <p>요청하신 임시 비밀번호는 <strong style="color:#f76f15">${tempPassword}</strong></p>
      <p style="margin-top:20px;">감사합니다.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ 이메일 전송 완료');
  } catch (err) {
    console.error('❌ 이메일 전송 실패:', err);
    throw err;
  }
};

module.exports = sendEmail;
