const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { name, nicname, email, password, confirmPassword, imageProfile } = req.body;

    // ตรวจสอบข้อมูลครบ
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });
    }

    // ตรวจสอบรหัสผ่านตรงกัน
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่แล้ว
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้างผู้ใช้ใหม่
    const newUser = new User({
      name,
      nicname,
      email,
      password: hashedPassword,
      imageProfile: imageProfile || ""
    });

    await newUser.save();

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: { name, nicname, email, imageProfile }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "ผู้ใช้ไม่พบ" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token หมดอายุ 7 วัน
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: { name: user.name, nicname: user.nicname, email: user.email, imageProfile: user.imageProfile }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;
