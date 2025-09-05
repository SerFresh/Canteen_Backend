const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // ดึง token จาก Header
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "ไม่มี token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บข้อมูลผู้ใช้จาก token ไว้ใน req.user
    next();
  } catch (err) {
    res.status(401).json({ message: "Token ไม่ถูกต้อง" });
  }
};
