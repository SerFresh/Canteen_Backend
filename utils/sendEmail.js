const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: "canteenkmitl@resend.dev",
      to: "freshhy75.42@gmail.com",
      subject: "Test Email",
      html: "<p>ทดสอบส่งอีเมล</p>"
    });
    console.log("✅ Email sent:", to);
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
}

module.exports = sendEmail;
