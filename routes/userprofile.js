const express = require('express');
const router = express.Router();
const User = require('../models/User');
// const auth = require('../middleware/auth');

//router.get('/profile/',auth , async (req, res) => { //ตรวจ Token
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /profile/:id
//router.put('/profile/',auth , async (req, res) => { //ตรวจ Token
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, nickname, imageProfile } = req.body;

    // หาผู้ใช้
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    // อัปเดตข้อมูลถ้ามีค่า
    if (name) user.name = name;
    if (nickname) user.nickname = nickname;
    if (imageProfile) user.imageProfile = imageProfile;

    await user.save();

    // ส่งข้อมูลผู้ใช้กลับ (ไม่รวม password)
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.status(200).json({ message: "แก้ไขโปรไฟล์เรียบร้อย", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
