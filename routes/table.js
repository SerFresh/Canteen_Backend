// routes/table.js
const express = require("express");
const router = express.Router();
const Table = require("../models/Table");
const Canteen = require("../models/Canteen");

// POST /table
router.post("/", async (req, res) => {
  try {
    const { T_ID, C_ID, T_Status, TimeReserve, Reserver } = req.body;

    // ตรวจสอบว่ามีโรงอาหารอยู่แล้ว
    const canteen = await Canteen.findOne({ C_ID });
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const newTable = new Table({
      T_ID,
      C_ID,
      T_Status,
      TimeReserve,
      Reserver,
    });

    await newTable.save();

    // อัปเดตจำนวนโต๊ะ Unavailable ของโรงอาหาร
    if (T_Status === "Unavailable") {
      canteen.Table += 1;
      await canteen.save();
    }

    res.status(201).json({ message: "Table created", table: newTable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
