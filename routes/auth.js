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
      `<p>⋆˙⟡ สวัสดี ${name}⋆˙⟡</p>
       <p>กรุณาคลิกปุ่มก์ด้านล่างเพื่อยืนยันอีเมลของคุณ ⸜(｡˃ ᵕ ˂ )⸝♡</p>
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
    <p>♡ ขอให้มีความสุขกับการใช้งานบริการของเรา ♡</p>`
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

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "กรอกอีเมลด้วย" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้" });

    // สร้าง token แบบ JWT หรือ random string
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // บันทึกลง user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 ชั่วโมง
    await user.save();

    const resetUrl = `https://canteen-backend-ten.vercel.app/api/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendEmail(
      email,
      "รีเซ็ตรหัสผ่าน",
      `<p>⋆˙⟡ สวัสดี ${user.name} ⋆˙⟡</p>
       <p>คลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ⸜(｡˃ ᵕ ˂ )⸝♡</p>
       <a href="${resetUrl}" 
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
      ตั้งรหัสผ่านใหม่
    </a>
    <p>♡ อย่าลืมรหัสผ่านอีกน้า ♡</p>`
    );

    res.json({ message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token) return res.status(400).json({ message: "ไม่มี token" });
    if (!password || !confirmPassword) return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });
    if (password !== confirmPassword) return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });

    // Hash password ใหม่
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // ลบ token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
});


module.exports = router;