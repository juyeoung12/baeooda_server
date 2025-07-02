const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const generateRandomNickname = require('../utils/generateNickname');
const getRandomProfileImage = require('../utils/randomProfileImage');
const authMiddleware = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ✅ 회원가입
router.post('/signup', async (req, res) => {
  let { name, email, username, password, year, month, day, profileImage } = req.body;

  year = year || null;
  month = month || null;
  day = day || null;

  try {
    const idCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (idCheck.rows.length > 0) {
      return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
    }

    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nickname = generateRandomNickname();
    if (!profileImage) profileImage = getRandomProfileImage();

    const sql = `INSERT INTO users (name, email, username, password, year, month, day, profileImage, nickname, provider)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'local')`;

    await db.query(sql, [name, email, username, hashedPassword, year, month, day, profileImage, nickname]);

    res.status(201).json({ message: '회원가입 되었습니다.', nickname });
  } catch (err) {
    console.error('회원가입 오류:', err.message);
    res.status(500).json({ error: '서버 오류: ' + err.message });
  }
});

// ✅ 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: '아이디 틀림' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: '비밀번호 틀림' });

    if (!user.nickname) {
      const newNickname = generateRandomNickname();
      await db.query('UPDATE users SET nickname = $1 WHERE id = $2', [newNickname, user.id]);
      user.nickname = newNickname;
    }

    if (!user.profileimage) {
      const newImage = getRandomProfileImage();
      await db.query('UPDATE users SET profileImage = $1 WHERE id = $2', [newImage, user.id]);
      user.profileimage = newImage;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        year: user.year,
        month: user.month,
        day: user.day,
        profileImage: user.profileimage,
        nickname: user.nickname,
        provider: user.provider || 'local'
      }
    });
  } catch (err) {
    console.error('로그인 오류:', err.message);
    res.status(500).json({ error: '서버 내부 오류: ' + err.message });
  }
});

// ✅ 사용자 정보 확인
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    let birth = null;
    if (user.year !== null && user.month !== null && user.day !== null) {
      const paddedMonth = String(user.month).padStart(2, '0');
      const paddedDay = String(user.day).padStart(2, '0');
      birth = `${user.year}-${paddedMonth}-${paddedDay}`;
    }


    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      birth,
      profileImage: user.profileimage,
      nickname: user.nickname,
      provider: user.provider || 'local'
    });
  } catch (err) {
    console.error('유저 정보 확인 오류:', err.message);
    res.status(500).json({ error: '유저 정보 불러오기 실패' });
  }
});

// ✅ 아이디 찾기
router.post('/find-id', async (req, res) => {
  const { name, email } = req.body;

  try {
    const result = await db.query(
      'SELECT username FROM users WHERE name = $1 AND email = $2',
      [name, email]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, username: result.rows[0].username });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error('아이디 찾기 오류:', err.message);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 비밀번호 찾기
router.post('/reset-password', async (req, res) => {
  const { username, email } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1 AND email = $2', [username, email]);

    if (result.rows.length === 0) {
      return res.json({ success: false });
    }

    const user = result.rows[0];
    const tempPassword = Math.random().toString(36).slice(2, 10);
    const hashed = await bcrypt.hash(tempPassword, 10);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);

    await sendEmail(email, `임시 비밀번호는 ${tempPassword} 입니다.`);

    res.json({ success: true });
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
