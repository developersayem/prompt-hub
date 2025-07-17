import nodemailer from "nodemailer";
import dotenv from "dotenv"

//end config
dotenv.config({})
export const sendVerificationEmail = async (to: string, code: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,         // mail.shopxet.com
    port: 465,                            // SSL port
    secure: true,                         // <- this MUST be true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // optional, helps with self-signed certs
    },
  });

  const mailOptions = {
    from: `"Prompt Hub" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verify your email address",
    html: `
      <h2>Welcome to Prompt Hub 👋</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #4f46e5;">${code}</h1>
      <p>Use this code to verify your email. It expires in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
