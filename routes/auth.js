const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // ใส่ใน .env

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name , email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email ถูกใช้งานแล้ว" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ 
      message: "สมัครสมาชิกเรียบร้อย",
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    // สร้าง JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token, // ส่ง token ให้ client
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        imageProfile: user.imageProfile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;