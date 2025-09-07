const nodemailer = require("nodemailer");

async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // หรือ smtp อื่น ๆ
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    }
  });

  await transporter.sendMail({
    from: `"Canteen App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = sendEmail;
