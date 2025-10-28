// sendEmail.js
const sgMail = require("@sendgrid/mail");

// ตั้งค่า API Key จาก environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html) {
  const msg = {
    to,                           // ผู้รับ
    from: "noreply@yourdomain.com", // แนะนำใช้ email ของคุณหรือ single sender ที่ verify แล้ว
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent:", to);
  } catch (error) {
    console.error("❌ Email send error:", error.response?.body || error);
    throw error;
  }
}

module.exports = sendEmail;
