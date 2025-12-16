const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const User = require("../models/User");
const admin = require("../middleware/firebaseAdmin.js")

// Helper: hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};


// POST /api/auth/google
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing token" });

    // 🔐 verify token จาก Google
    const decoded = await admin.auth().verifyIdToken(idToken);

    const { uid, email, name, picture } = decoded;

    let user = await User.findOne({ email });

    // 🆕 ถ้ายังไม่มี user → create
    if (!user) {
      user = new User({
        name,
        email,
        imageProfile: picture,
        provider: "google",
        googleId: uid,
        verified: true // ✅ ข้าม email verification
      });

      await user.save();
    }

    // ❌ ป้องกัน email ซ้ำ (สมัคร local มาก่อน)
    if (user.provider !== "google") {
      return res.status(400).json({
        message: "อีเมลนี้สมัครด้วยรหัสผ่านไว้แล้ว"
      });
    }

    // 🔑 ออก JWT ของระบบ
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "เข้าสู่ระบบด้วย Google สำเร็จ",
      token,
      user: {
        name: user.name,
        email: user.email,
        imageProfile: user.imageProfile
      }
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google token ไม่ถูกต้อง" });
  }
});

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { name, nickname, email, password, confirmPassword, imageProfile } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const hashedPassword = await hashPassword(password);

    // สร้าง user ใหม่
    const newUser = new User({
      name,
      nickname,
      email,
      password: hashedPassword,
      imageProfile: imageProfile || "",
      verified: false,
      createdAt: new Date()
    });

    await newUser.save();

    // สร้าง token อายุ 5 นาที
    const verifyToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}`;

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
        margin:20px 0; background: 
        linear-gradient(90deg, #FF8001, #FBC02D); 
        color:white; text-decoration:none; 
        font-weight:bold; border-radius:6px; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); ">   
        ยืนยันอีเมล 
        </a> 
        <p>♡ ขอให้มีความสุขกับการใช้งานบริการของเรา ♡</p> `
      );

    // ตั้ง timeout ลบ user ถ้าไม่ verify ภายใน 5 นาที (ข้อจำกัด: ถ้า server restart จะไม่ทำงาน)
    setTimeout(async () => {
      const user = await User.findById(newUser._id);
      if (user && !user.verified) {
        await User.findByIdAndDelete(newUser._id);
        console.log(`User ${user.email} deleted due to expired verification token`);
      }
    }, 300 * 1000);

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลที่กล่องข้อความ",
      token: verifyToken
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

    if (user.provider === "google") {
      return res.status(400).json({
        message: "บัญชีนี้ใช้ Google Login"
      });
    }

    if (!user.verified)
      return res.status(400).json({ message: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });

    // สร้าง JWT Token (1 วัน)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: { name: user.name, nickname: user.nickname, email: user.email, imageProfile: user.imageProfile }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/auth/verify-email?token=xxxx
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).send("ไม่พบผู้ใช้");

    user.verified = true;
    await user.save();

    // ออก token login ใหม่
    const loginToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Redirect ไป frontend
    return res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${loginToken}`);
  } catch (err) {
    return res.status(400).send("ลิงก์ไม่ถูกต้องหรือหมดอายุ");
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "กรอกอีเมลด้วย" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้" });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

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

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (!token) return res.status(400).json({ message: "ไม่มี token" });
    if (!password || !confirmPassword) return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });
    if (password !== confirmPassword) return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });

    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword)
      return res.status(400).json({ message: "กรอกข้อมูลไม่ครบ" });

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ message: "รหัสผ่านใหม่ไม่ตรงกัน" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "ผู้ใช้ไม่พบ" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "รหัสเก่าไม่ถูกต้อง" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
