const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/user/profile (ต้องมี token)
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name nicname email imageProfile");
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

// PUT /api/user/profile
router.put("/profile", auth, async (req, res) => {
  const { name, nicname, imageProfile } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    // อัปเดตเฉพาะฟิลด์ที่ส่งมา
    if (name !== undefined) user.name = name;
    if (nicname !== undefined) user.nicname = nicname;
    if (imageProfile !== undefined) user.imageProfile = imageProfile;

    await user.save();

    // ส่งข้อมูลกลับเฉพาะ 4 ฟิลด์
    res.json({
      name: user.name,
      nicname: user.nicname,
      email: user.email,
      imageProfile: user.imageProfile,
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

module.exports = router;
