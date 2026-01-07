const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

// multer
const upload = multer({ storage: multer.memoryStorage() });

// cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper upload
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "profiles" }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
      .end(buffer);
  });
};

/* =========================
   GET PROFILE
========================= */
router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("username nickname imageProfile role");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

/* =========================
   UPDATE PROFILE
========================= */
router.put(
  "/profile",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { nickname } = req.body;
      const updateData = {};

      if (nickname) updateData.nickname = nickname;

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        updateData.imageProfile = result.secure_url;
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true }
      ).select("username nickname imageProfile role");

      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =========================
   ADMIN: GET ALL USERS
========================= */
router.get(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  async (req, res) => {
    const users = await User.find()
      .select("username nickname imageProfile role createdAt");
    res.json(users);
  }
);

/* =========================
   ADMIN: CHANGE USER ROLE
========================= */
router.put(
  "/:id/role",
  authMiddleware,
  checkRole(["admin"]),
  async (req, res) => {
    const { role } = req.body;

    if (!["user", "admin", "chef"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    if (req.user.id === req.params.id)
      return res.status(400).json({
        message: "ไม่สามารถเปลี่ยน role ของตัวเองได้",
      });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("username nickname role");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "เปลี่ยน role สำเร็จ", user });
  }
);

/* =========================
   ADMIN: GET USER BY ROLE
========================= */
router.get(
  "/role/:role",
  authMiddleware,
  checkRole(["admin"]),
  async (req, res) => {
    const { role } = req.params;

    if (!["user", "admin", "chef"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const users = await User.find({ role })
      .select("username nickname imageProfile role");

    res.json(users);
  }
);

module.exports = router;
