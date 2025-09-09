// routes/table.js
const express = require("express");
const router = express.Router();
const Table = require("../models/Table");
const Canteen = require("../models/Canteen");

// POST /table - รองรับสร้างหลายโต๊ะพร้อมกัน
router.post("/", async (req, res) => {
  try {
    let tablesData = req.body;

    // ถ้าเป็น object เดียว ให้แปลงเป็น array
    if (!Array.isArray(tablesData)) {
      tablesData = [tablesData];
    }

    const createdTables = [];

    for (const t of tablesData) {
      const { T_ID, C_ID, T_Status, TimeReserve, Reserver } = t;

      // ตรวจสอบว่ามีโรงอาหารอยู่แล้ว
      const canteen = await Canteen.findOne({ C_ID });
      if (!canteen) return res.status(404).json({ message: `Canteen ${C_ID} not found` });

      const newTable = new Table({ T_ID, C_ID, T_Status, TimeReserve, Reserver });
      await newTable.save();

      // อัปเดตจำนวนโต๊ะ Unavailable ของโรงอาหาร
      if (T_Status === "Unavailable") {
        canteen.Table += 1;
        await canteen.save();
      }

      createdTables.push(newTable);
    }

    res.status(201).json({ message: "Tables created", tables: createdTables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;