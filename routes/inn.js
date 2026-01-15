const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");
const Inn = require("../models/Inn");

// ➕ เพิ่ม Inn ในโรงอาหาร
router.post("/:canteenId/inns", async (req, res) => {
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
router.patch("/:canteenId/inns/:innId", async (req, res) => {
  try {
    const { canteenId, innId } = req.params;
    const { name, type } = req.body;

    const inn = await Inn.findOneAndUpdate(
      { _id: innId, canteenID: canteenId },
      { name, type },
      { new: true, runValidators: true }
    );

    if (!inn) {
      return res.status(404).json({ message: "Inn not found" });
    }

    res.json({ message: "Inn updated", data: inn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 🧹 ลบ name + type (set null)
router.patch("/:canteenId/inns/:innId/clear", async (req, res) => {
  try {
    const { canteenId, innId } = req.params;

    const inn = await Inn.findOneAndUpdate(
      { _id: innId, canteenID: canteenId },
      { name: "none", type: "none" },
      { new: true }
    );

    if (!inn) {
      return res.status(404).json({ message: "Inn not found" });
    }

    await Menu.deleteMany({ innID: innId });

    res.json({
      message: "Inn cleared and menus deleted",
      data: inn,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 📡 รับค่าจาก Arduino Sensor
router.patch("/:canteenId/inns/:innId/sensor", async (req, res) => {
  try {
    const { canteenId, innId } = req.params;
    const { arduinoSensor } = req.body;

    // ✅ รับได้ทั้ง true และ false
    if (typeof arduinoSensor !== "boolean") {
      return res.status(400).json({
        message: "arduinoSensor must be boolean",
      });
    }

    const inn = await Inn.findOneAndUpdate(
      {
        _id: innId,
        canteenID: canteenId,
      },
      { arduinoSensor },
      { new: true, runValidators: true }
    );

    if (!inn) {
      return res.status(404).json({
        message: "Inn not found in this canteen",
      });
    }

    res.json({
      message: "Sensor updated successfully",
      data: inn,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




module.exports = router;