const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const bodyParser = require('body-parser');
const usersRouter = require('./routes/users');
const tasksRouter = require('./routes/tasks');
const db = require('./db');
const cron = require('node-cron');
const { sendReminder } = require('./utils/mailer');

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

// API routes
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);

// serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// background job: runs every minute and checks for tasks due in next 30 minutes
const REMINDER_MINUTES_BEFORE = 30;

cron.schedule('* * * * *', () => {
  const now = Date.now();
  const windowStart = now;
  const windowEnd = now + REMINDER_MINUTES_BEFORE * 60 * 1000;

  // select tasks with due_datetime between now and windowEnd, not completed, reminder_sent=0
  const sql = `SELECT tasks.*, users.email AS user_email FROM tasks
    JOIN users ON users.id = tasks.user_id
    WHERE tasks.due_datetime IS NOT NULL
      AND tasks.due_datetime > ?
      AND tasks.due_datetime <= ?
      AND tasks.completed = 0
      AND tasks.reminder_sent = 0`;

  db.all(sql, [windowStart, windowEnd], async (err, rows) => {
    if (err) {
      console.error('Cron DB error:', err);
      return;
    }
    for (const t of rows) {
      const due = new Date(t.due_datetime);
      const subject = `Reminder: "${t.title}" is due at ${due.toLocaleString()}`;
      const body = `Hi,\n\nThis is a reminder that your task "${t.title}" is due at ${due.toLocaleString()}.\n\nDescription: ${t.description || 'No description'}\n\nOpen your Todo app to manage it.`;
      try {
        await sendReminder(t.user_email, subject, body);
        // mark reminder_sent = 1 to avoid duplicate
        db.run('UPDATE tasks SET reminder_sent = 1 WHERE id = ?', [t.id]);
      } catch (e) {
        console.error('Failed to send reminder for task', t.id, e);
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
