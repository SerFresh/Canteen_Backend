const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// POST /api/register
router.post("/register", async (req, res) => {
  try {
    const { name, nickname, email, password, confirmPassword, imageProfile } = req.body;

    // ตรวจสอบข้อมูลครบ
    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    // ตรวจสอบ email ซ้ำ
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้าง user
    const newUser = new User({
      name,
      nickname,
      email,
      password: hashedPassword,
      imageProfile: imageProfile || "",
    });

    await newUser.save();

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", user: { name: newUser.name, email: newUser.email, nickname: newUser.nickname, imageProfile: newUser.imageProfile } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
