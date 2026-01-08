const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");
const Inn = require("../models/Inn");

// ➕ เพิ่ม Inn ในโรงอาหาร
router.post("/canteens/:canteenId/inns", async (req, res) => {
  try {
    const { canteenId } = req.params;
    const { innNumber, name, type } = req.body;

    // ตรวจสอบว่าโรงอาหารมีอยู่จริง
    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ message: "Canteen not found" });
    }

    // ตรวจสอบข้อมูลขั้นต่ำ
    if (!innNumber) {
      return res.status(400).json({
        message: "innNumber is required",
      });
    }

    const inn = await Inn.create({
      canteenID: canteenId,
      innNumber,
      name: name ?? null,
      type: type ?? null,
    });

    res.status(201).json({
      message: "Inn created successfully",
      data: inn,
    });
  } catch (error) {
    // กรณีเลขร้านซ้ำในโรงอาหารเดียวกัน
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Inn number already exists in this canteen",
      });
    }

    res.status(500).json({ message: error.message });
  }
});

// ✏️ แก้ไข name และ type
router.put("/:id", async (req, res) => {
  try {
    const { name, type } = req.body;

    const inn = await Inn.findByIdAndUpdate(
      req.params.id,
      { name, type },
      { new: true, runValidators: true }
    );

    if (!inn) {
      return res.status(404).json({ message: "Inn not found" });
    }

    res.json({
      message: "Inn updated successfully",
      data: inn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🧹 ลบ name + type (set null)
router.patch("/:id/clear", async (req, res) => {
  try {
    const inn = await Inn.findByIdAndUpdate(
      req.params.id,
      {
        name: null,
        type: null,
      },
      { new: true }
    );

    if (!inn) {
      return res.status(404).json({ message: "Inn not found" });
    }

    res.json({
      message: "Inn name and type cleared",
      data: inn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;