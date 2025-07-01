const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../../models/db');
const generateRandomNickname = require('../../utils/generateNickname');
const getRandomProfileImage = require('../../utils/randomProfileImage');

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_REDIRECT_URI = 'http://localhost:5173/oauth/naver';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/', async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ success: false, message: 'code 또는 state가 없습니다.' });
  }

  try {
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

    const userRes = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userRes.data?.response;
    const email = profile.email || '';
    const name = profile.name || null;
    const username = `naver_${profile.id}`;

    let user;
    const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      user = existing[0];
    } else {
      const nickname = generateRandomNickname();
      const profileImage = getRandomProfileImage();

      const [insertResult] = await db.query(
        'INSERT INTO users (username, email, name, provider, profileImage, nickname) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, name, 'naver', profileImage, nickname]
      );

      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
      user = rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
        profileImage: user.profileImage,
        provider: user.provider || 'naver'
      }
    });
  } catch (err) {
    console.error('❌ 네이버 로그인 실패:', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: '네이버 로그인 실패' });
  }
});

module.exports = router;
