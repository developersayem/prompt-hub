import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendTwoFactorCodeEmail = async (to: string, code: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // e.g., mail.shopxet.com
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"PastPrompt Security" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your 2FA Verification Code",
    html: `
      <h2>🔒 Two-Factor Authentication</h2>
      <p>Here is your 2FA verification code:</p>
      <h1 style="color: #10b981;">${code}</h1>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
