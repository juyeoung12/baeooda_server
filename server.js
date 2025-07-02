require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const emailRoutes = require('./routes/email');

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
app.use('/api/auth', authRoutes);       // 회원가입, 로그인, find-id 등
app.use('/api/oauth', oauthRoutes);     // 소셜 로그인 (Google, Kakao, Naver 등)
app.use('/api/email', emailRoutes);     // 이메일 인증 등

// ✅ 루트 경로 기본 응답 추가
app.get('/', (req, res) => {
  res.send('✅ 백엔드 서버가 정상적으로 작동 중입니다!');
});

// ✅ 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 (http://localhost:${PORT})`);
});
