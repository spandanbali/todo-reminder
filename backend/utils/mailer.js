const nodemailer = require('nodemailer');

let transporter = null;
const USE_REAL_EMAIL = false; // change to true to use SMTP below

if (USE_REAL_EMAIL) {
  // Example: Gmail SMTP (you must configure app password or allow less-secure apps)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendReminder(toEmail, subject, body) {
  if (USE_REAL_EMAIL && transporter) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text: body
    });
    console.log('Email sent to', toEmail);
  } else {
    // fallback: log to console — this satisfies the "simulate" option
    console.log('--- REMINDER (simulated email) ---');
    console.log('To:', toEmail);
    console.log('Subject:', subject);
    console.log('Body:', body);
    console.log('-------------------------------');
  }
}

module.exports = { sendReminder };
