const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");

//เพิ่มเมนูอาหาร
router.post("/:innId/menus", async (req, res) => {
  try {
    const { innId } = req.params;
    const { name, price } = req.body;

    const menu = await Menu.create({
      innID: innId,
      name,
      price,
    });

    res.status(201).json({ message: "Menu added", data: menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//แก้ไขชื่อเมนู & ราคา
router.patch("/:menuId", async (req, res) => {
  try {
    const { menuId } = req.params;
    const { name, price } = req.body;

    const menu = await Menu.findByIdAndUpdate(
      menuId,
      { name, price },
      { new: true, runValidators: true }
    );

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json({ message: "Menu updated", data: menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ลบเมนู
router.delete("/:menuId", async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.menuId);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

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