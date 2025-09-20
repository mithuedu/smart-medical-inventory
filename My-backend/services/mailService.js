// services/mailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST || "smtp.gmail.com",
  port: Number(EMAIL_PORT) || 587,
  secure: Number(EMAIL_PORT) === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter.verify()
  .then(() => console.log("✅ SMTP ready"))
  .catch(err => console.error("❌ SMTP verify failed:", err));

async function sendOtpEmail({ to, otp, subject = "Your verification code" }) {
  const html = `
    <div style="font-family: sans-serif; line-height: 1.4; color: #111;">
      <h2 style="color:#1194FF">Your OTP Code</h2>
      <p>Use the code below to verify your account. This code will expire soon.</p>
      <div style="font-size: 28px; margin: 16px 0; letter-spacing: 6px;"><strong>${otp}</strong></div>
      <p>If you didn’t request this, ignore this email.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: EMAIL_USER,
    to,
    subject,
    html,
  });

  console.log("✅ OTP sent:", info.messageId);
  return info;
}

module.exports = { sendOtpEmail };
