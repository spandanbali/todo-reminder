const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const bodyParser = require('body-parser');
const usersRouter = require('./routes/users');
const tasksRouter = require('./routes/tasks');
const db = require('./db');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(bodyParser.json());
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite3', dir: __dirname }),
  secret: 'replace_this_secret_in_prod',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------------- EMAIL SYSTEM ---------------- //
const REMINDER_MINUTES_BEFORE = 5;

// Create Gmail transporter using your .env credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// background job: runs every 5 minutes and checks for tasks due soon
cron.schedule("*/5 * * * *", () => {
  console.log("⏰ Checking for upcoming tasks...");

  const now = Date.now();
  const windowStart = now;
  const windowEnd = now + REMINDER_MINUTES_BEFORE * 60 * 1000;

  const sql = `SELECT tasks.*, users.email AS user_email 
               FROM tasks
               JOIN users ON users.id = tasks.user_id
               WHERE tasks.due_datetime IS NOT NULL
                 AND tasks.due_datetime > ?
                 AND tasks.due_datetime <= ?
                 AND tasks.completed = 0
                 AND tasks.reminder_sent = 0`;

  db.all(sql, [windowStart, windowEnd], async (err, rows) => {
    if (err) {
      console.error("Cron DB error:", err);
      return;
    }

    for (const t of rows) {
      const due = new Date(t.due_datetime);
      const subject = `Reminder: "${t.title}" is due at ${due.toLocaleString()}`;
      const body = `Hi,\n\nThis is a reminder that your task "${t.title}" is due at ${due.toLocaleString()}.\n\nDescription: ${t.description || 'No description'}\n\nOpen your Todo app to manage it.`;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: t.user_email,
          subject,
          text: body,
        });

        db.run('UPDATE tasks SET reminder_sent = 1 WHERE id = ?', [t.id]);
        console.log(`📧 Reminder email sent to ${t.user_email} for task "${t.title}"`);
      } catch (e) {
        console.error('❌ Failed to send reminder for task', t.id, e);
      }
    }
  });
});

// ---------------- INSTANT TASK COMPLETION EMAIL ---------------- //
app.post('/api/task-completed', async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: "Missing taskId" });

  // get task + user email
  db.get(
    `SELECT tasks.*, users.email AS user_email 
     FROM tasks 
     JOIN users ON users.id = tasks.user_id 
     WHERE tasks.id = ?`,
    [taskId],
    async (err, t) => {
      if (err || !t) return res.status(404).json({ error: "Task not found" });

      const subject = `✅ Task Completed: "${t.title}"`;
      const body = `Hi,\n\nYou just completed your task "${t.title}".\n\nDescription: ${t.description || 'No description'}\n\nGreat job staying productive! 🎉`;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: t.user_email,
          subject,
          text: body,
        });

        console.log(`🎉 Completion email sent to ${t.user_email} for "${t.title}"`);
        res.json({ success: true });
      } catch (e) {
        console.error('❌ Failed to send completion email for task', t.id, e);
        res.status(500).json({ error: 'Email failed' });
      }
    }
  );
});

app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
