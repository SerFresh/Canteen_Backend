// routes/canteen.js
const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");

// POST /canteen → สร้างโรงอาหารใหม่
router.post("/", async (req, res) => {
  try {
    const { C_name, Capacity, C_Status, Zone } = req.body;

    const newCanteen = new Canteen({
      C_name,
      Capacity,
      C_Status,
      Zone: Zone || [],
      Tables: [] // เริ่มต้นไม่มีโต๊ะ
    });

    await newCanteen.save();
    res.status(201).json({ message: "Canteen created", canteen: newCanteen });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /canteen → ดึงข้อมูลโรงอาหารทั้งหมด
router.get("/", async (req, res) => {
  try {
    const canteens = await Canteen.find();
    res.json(canteens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /canteen/:id → ดูข้อมูลโรงอาหารทีละตัว
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const canteen = await Canteen.findById(id);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    res.json(canteen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/:canteenId/tables/batch", async (req, res) => {
  try {
    const tablesData = req.body; // คาดว่าเป็น array ของโต๊ะ
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    tablesData.forEach(tableData => {
      const { number, status, reservedBy, reservedTime } = tableData;

      if (!["Available", "Unavailable", "Reserved"].includes(status)) return;

      const existingTable = canteen.Tables.find(t => t.number === number);

      if (existingTable) {
        existingTable.status = status;
        existingTable.reservedBy = reservedBy || "";
        existingTable.reservedTime = reservedTime ? new Date(reservedTime) : null;
      } else {
        canteen.Tables.push({
          number,
          status,
          reservedBy: reservedBy || "",
          reservedTime: reservedTime ? new Date(reservedTime) : null,
        });
      }
    });

    await canteen.save();
    res.json({ message: "Tables updated successfully", tables: canteen.Tables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;