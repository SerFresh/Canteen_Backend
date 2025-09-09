const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth"); // ตรวจ token

const router = express.Router();

// ตั้ง storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    cb(null, `${Date.now()}.${ext}`);
  },
});
const upload = multer({ storage });

// Serve static uploads
router.use("/uploads", express.static("uploads"));

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

// PUT /api/user/profile
router.put("/profile", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, nickname } = req.body;
    const updateData = { name, nickname };

    if (req.file) {
      // full URL สำหรับ frontend
      const protocol = req.protocol;
      const host = req.get("host");
      updateData.imageProfile = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
