const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ตั้ง multer สำหรับรับไฟล์
const storage = multer.memoryStorage(); // ใช้ memoryStorage แทน local folder
const upload = multer({ storage });

// ตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// PUT /profile
router.put("/profile", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, nickname } = req.body;
    const updateData = { name, nickname };

    if (req.file) {
      // อัปโหลดไป Cloudinary
      const result = await cloudinary.uploader.upload_stream(
        { folder: "user_profiles" },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Cloudinary upload error", error });
          
          updateData.imageProfile = result.secure_url; // เก็บ URL ใน MongoDB

          // อัปเดต user
          const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
          res.json(updatedUser);
        }
      );

      // ส่งไฟล์ไป cloudinary
      result.end(req.file.buffer);
    } else {
      // ถ้าไม่มีรูป อัปเดต name/nickname
      const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
      res.json(updatedUser);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name nickname email imageProfile");
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

module.exports = router;
