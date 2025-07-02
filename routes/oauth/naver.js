const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../../models/db');
const generateRandomNickname = require('../../utils/generateNickname');
const getRandomProfileImage = require('../../utils/randomProfileImage');

// ✅ 환경 변수 사용
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_REDIRECT_URI = process.env.NAVER_REDIRECT_URI; // ← 이 부분 수정
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/', async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ success: false, message: 'code 또는 state가 없습니다.' });
  }

  try {
    // ✅ 액세스 토큰 요청
    const tokenRes = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        redirect_uri: NAVER_REDIRECT_URI,
        code,
        state,
      },
    });

    const access_token = tokenRes.data.access_token;
    if (!access_token) {
      return res.status(500).json({ success: false, message: '토큰 발급 실패' });
    }

    // ✅ 사용자 정보 요청
    const userRes = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userRes.data?.response;
    const email = profile.email || '';
    const name = profile.name || null;
    const username = `naver_${profile.id}`;

    let user;

    const existing = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const nickname = generateRandomNickname();
      const profileImage = getRandomProfileImage();

      const insertResult = await db.query(
        'INSERT INTO users (username, email, name, provider, profileImage, nickname) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [username, email, name, 'naver', profileImage, nickname]
      );

      user = insertResult.rows[0];
    }

    // ✅ JWT 토큰 발급
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // ✅ 쿠키 저장 (프론트가 브라우저 쿠키로 받는 경우)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 배포 시 HTTPS 보안 적용
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileimage,
        provider: user.provider || 'naver'
      }
    });
  } catch (err) {
    console.error('❌ 네이버 로그인 실패:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: '네이버 로그인 실패' });
  }
});

module.exports = router;
