const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../../models/db');
const generateRandomNickname = require('../../utils/generateNickname');
const getRandomProfileImage = require('../../utils/randomProfileImage');

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI; // 🔁 수정됨
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'code 없음' });

  try {
    // ✅ 액세스 토큰 요청
    const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      },
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const access_token = tokenRes.data.access_token;

    // ✅ 사용자 정보 요청
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const kakaoUser = userRes.data;
    const kakaoId = kakaoUser.id;
    const email = kakaoUser.kakao_account?.email || '';
    const name = kakaoUser.kakao_account?.name || null;
    const username = `kakao_${kakaoId}`;

    let user;
    const existing = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const nickname = generateRandomNickname();
      const profileImage = getRandomProfileImage();

      const insertResult = await db.query(
        'INSERT INTO users (username, email, name, provider, profileImage, nickname) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [username, email, name, 'kakao', profileImage, nickname]
      );

      user = insertResult.rows[0];
    }

    // ✅ JWT 발급
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // ✅ 쿠키 저장 (필요 시)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
        provider: user.provider || 'kakao',
      },
    });
  } catch (err) {
    console.error('❌ 카카오 로그인 실패:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: '카카오 로그인 실패' });
  }
});

module.exports = router;
