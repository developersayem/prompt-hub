import nodemailer from "nodemailer";
import dotenv from "dotenv"

//end config
dotenv.config({})

export const sendVerificationEmail = async (to: string, code: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,           // e.g., mail.yourdomain.com
    port: parseInt(process.env.SMTP_PORT!), // e.g., 587
    secure: false, // false for 587 (TLS), true for 465 (SSL)
    auth: {
      user: process.env.SMTP_USER, // e.g., noreply@yourdomain.com
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"PromptHub" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verify your email address",
    html: `
      <h2>Welcome to PromptHub 👋</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #4f46e5;">${code}</h1>
      <p>Use this code to verify your email. It expires in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
