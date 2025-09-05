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

module.exports = router;
