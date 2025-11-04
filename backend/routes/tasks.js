const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { ensureLoggedIn } = require('../auth');

// get tasks for logged in user
router.get('/', ensureLoggedIn, (req, res) => {
  const userId = req.session.userId;
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_datetime IS NULL, due_datetime', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// create
router.post('/', ensureLoggedIn, (req, res) => {
  const { title, description, due_datetime } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const id = uuidv4();
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO tasks (id, user_id, title, description, due_datetime, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, req.session.userId, title, description || '', due_datetime || null, now, now, function(err) {
    if (err) return res.status(500).json({ error: 'DB insert error' });
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      res.json(row);
    });
  });
});

// update (edit or mark completed)
router.put('/:id', ensureLoggedIn, (req, res) => {
  const id = req.params.id;
  const { title, description, due_datetime, completed } = req.body;
  const now = Date.now();
  const stmt = db.prepare('UPDATE tasks SET title = ?, description = ?, due_datetime = ?, completed = ?, updated_at = ? WHERE id = ? AND user_id = ?');
  stmt.run(title, description, due_datetime || null, completed ? 1 : 0, now, id, req.session.userId, function(err) {
    if (err) return res.status(500).json({ error: 'DB update error' });
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      res.json(row);
    });
  });
});

// delete
router.delete('/:id', ensureLoggedIn, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.session.userId], function(err) {
    if (err) return res.status(500).json({ error: 'DB delete error' });
    res.json({ ok: true });
  });
});

module.exports = router;
