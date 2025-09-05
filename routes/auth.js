const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Register (ที่ทำไปแล้ว)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      nickname: "",
      imageProfile: ""
    });

    await newUser.save();
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบ input
    if (!email || !password) {
      return res.status(400).json({ message: "กรอกข้อมูลให้ครบ" });
    }

    // หา user จาก email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้" });

    // ตรวจสอบ password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    // สร้าง JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        imageProfile: user.imageProfile
      }
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

module.exports = router;
