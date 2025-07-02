// routes/user.js
router.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, birth } = req.body;

  try {
    await db.query(
      'UPDATE users SET name = $1, birth = $2 WHERE id = $3',
      [name, birth, id]
    );

    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    res.json(result.rows[0]); // PostgreSQL은 rows 배열 반환
  } catch (err) {
    console.error('사용자 정보 수정 오류:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});
