// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token
  if (!token) return res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // id และ email ของผู้ใช้
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

module.exports = auth;
