const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const User = require("../models/User");

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { name, nicname, email, password, confirmPassword, imageProfile } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      nicname,
      email,
      password: hashedPassword,
      imageProfile: imageProfile || "",
      verified: false
    });

    await newUser.save();

    // ✅ สร้าง token สำหรับการยืนยันอีเมล
    const verifyToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ encodeURIComponent เพื่อป้องกันปัญหา URL
    const verifyUrl = `https://canteen-backend-ten.vercel.app/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`;

    // ✅ ส่งอีเมล
    await sendEmail(
      email,
      "ยืนยันการสมัครสมาชิก",
      `
      <div style="font-family: Arial, sans-serif; background:#FFFFFF; padding:30px; text-align:center; border:1px solid #B3B3B3; border-radius:8px; max-width:600px; margin:auto;">
        
        <!-- Header -->
        <h1 style="color:#FF8001; margin-bottom:10px;">ยินดีต้อนรับ ${name}!</h1>
        <p style="color:#656565; font-size:16px;">กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ</p>

        <!-- ปุ่มยืนยันอีเมล -->
        <a href="${verifyUrl}" 
          style="
            display:inline-block; 
            padding:12px 30px; 
            margin:20px 0; 
            background: linear-gradient(90deg, #FF8001, #FBC02D); 
            color:white; 
            text-decoration:none; 
            font-weight:bold; 
            border-radius:6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
          ยืนยันอีเมล
        </a>

        <!-- ข้อความประกอบ -->
        <p style="color:#656565; font-size:14px; margin-top:20px;">
          หากคุณไม่ได้สมัครสมาชิก โปรดละเว้นอีเมลนี้
        </p>

        <!-- เส้นแบ่ง -->
        <hr style="border:none; border-top:1px solid #D9D9D9; margin:30px 0;">

        <!-- Footer -->
        <p style="color:#151515; font-size:12px;">
          © 2025 YourCompany. สงวนลิขสิทธิ์
        </p>

      </div>
      `
    );


    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลที่กล่องข้อความ",
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

    if (!user.verified)
      return res.status(400).json({ message: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
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

// GET /verify-email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "ไม่มี token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, { verified: true });

    res.json({ message: "ยืนยันอีเมลสำเร็จแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
});


// GET /profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({
      name: user.name,
      nicname: user.nicname,
      email: user.email,
      imageProfile: user.imageProfile
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;