require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const emailRoutes = require('./routes/email'); // ✅ 이메일 라우터 추가

const app = express();

// ✅ CORS 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ JSON 요청 파싱
app.use(express.json());

// ✅ 라우터 등록
app.use('/api/auth', authRoutes);       // ✅ 회원가입, 로그인, find-id 포함
app.use('/api/oauth', oauthRoutes);     // ✅ 소셜 로그인
app.use('/api/email', emailRoutes);     // ✅ 이메일 인증

// ✅ 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 (http://localhost:${PORT})`);
});
