const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "ไม่มี token, กรุณาเข้าสู่ระบบ" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บ user id
    next();
  } catch (err) {
    res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
}

module.exports = auth;
