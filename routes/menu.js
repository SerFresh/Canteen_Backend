const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// multer (memory)
const upload = multer({ storage: multer.memoryStorage() });

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// helper upload buffer → cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "menus" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};


//เพิ่มเมนูอาหาร
router.post("/:innId/menus", upload.single("image"), async (req, res) => {
  try {
    const { innId } = req.params;
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "name and price are required",
      });
    }

    let image = null;
    let imagePublicId = null;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      image = result.secure_url;
      imagePublicId = result.public_id;
    }

    const menu = await Menu.create({
      innID: innId,
      name,
      price,
      image,
      imagePublicId,
    });

    res.status(201).json({ message: "Menu added", data: menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//แก้ไขชื่อเมนู & ราคา
router.patch("/:menuId", upload.single("image"), async (req, res) => {
  try {
    const { menuId } = req.params;
    const { name, price } = req.body;

    const menu = await Menu.findById(menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    if (name) menu.name = name;
    if (price) menu.price = price;

    // 🔥 เปลี่ยนรูป → ลบรูปเก่าก่อน
    if (req.file) {
      if (menu.imagePublicId) {
        await cloudinary.uploader.destroy(menu.imagePublicId);
      }

      const result = await uploadToCloudinary(req.file.buffer);
      menu.image = result.secure_url;
      menu.imagePublicId = result.public_id;
    }

    await menu.save();

    res.json({ message: "Menu updated", data: menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//ลบเมนู
router.delete("/:menuId", async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    // 🔥 ลบรูปออกจาก Cloudinary
    if (menu.imagePublicId) {
      await cloudinary.uploader.destroy(menu.imagePublicId);
    }

    await menu.deleteOne();

    res.json({ message: "Menu deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//เมนูแนะนำ
router.patch("/:menuId/like", async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    // นับเมนูที่ถูกใจแล้วในร้านเดียวกัน
    const likedCount = await Menu.countDocuments({
      innID: menu.innID,
      like: true,
    });

    if (!menu.like && likedCount >= 3) {
      return res.status(400).json({
        message: "Maximum 3 recommended menus per inn",
      });
    }

    menu.like = !menu.like;
    await menu.save();

    res.json({
      message: "Menu like updated",
      data: menu,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;