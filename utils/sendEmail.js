import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // ใช้ TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"CanteenKMITL" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
