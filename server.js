require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const emailRoutes = require('./routes/email');

const app = express();

const allowedOrigins = [
  'https://baeooda.vercel.app',    // ✅ 배포된 프론트엔드
  'http://localhost:5173'          // ✅ 로컬 개발 환경
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS 차단: 허용되지 않은 origin입니다.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ OPTIONS 사전 요청에 대한 처리
app.options('*', cors());

// ✅ JSON 요청 파싱
app.use(express.json());

// ✅ 라우터 등록
app.use('/api/auth', authRoutes);       // 회원가입, 로그인, 아이디/비밀번호 찾기 등
app.use('/api/oauth', oauthRoutes);     // 소셜 로그인
app.use('/api/email', emailRoutes);     // 이메일 인증

// ✅ 기본 루트 경로 응답
app.get('/', (req, res) => {
  res.send('✅ 백엔드 서버가 정상적으로 작동 중입니다!');
});

// ✅ 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 (http://localhost:${PORT})`);
});
