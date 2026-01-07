const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const auth = require("../middleware/auth");

// ======================
// Helper: hash password
// ======================
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// ======================
// REGISTER
// POST /api/auth/register
// ======================
router.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    if (password.length < 6)
      return res.status(400).json({ message: "รหัสผ่านต้องอย่างน้อย 6 ตัว" });

    const normalizedUsername = username.toLowerCase().trim();

    const exists = await User.findOne({ username: normalizedUsername });
    if (exists)
      return res.status(400).json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });

    const user = new User({
      username: normalizedUsername,
      password: await hashPassword(password),
    });

    await user.save();

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ======================
// LOGIN
// POST /api/auth/login
// ======================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    const normalizedUsername = username.toLowerCase().trim();

    const user = await User
      .findOne({ username: normalizedUsername })
      .select("+password");

    if (!user)
      return res.status(400).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ======================
// CHANGE PASSWORD
// POST /api/auth/change-password
// ======================
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ message: "รหัสผ่านใหม่ไม่ตรงกัน" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "รหัสผ่านต้องอย่างน้อย 6 ตัว" });

    const user = await User
      .findById(req.user.id)
      .select("+password");

    if (!user)
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
