// routes/user.js
router.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, birth } = req.body;

  await db.query('UPDATE users SET name = ?, birth = ? WHERE id = ?', [name, birth, id]);

  const [updated] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  res.json(updated[0]);
});
