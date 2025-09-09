// routes/canteen.js
const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");

// สร้างโรงอาหาร
router.post("/", async (req, res) => {
  try {
    const { name, zones, tables } = req.body;
    const newCanteen = new Canteen({ name, zones, tables: tables || [] });
    await newCanteen.save();
    res.status(201).json(newCanteen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เพิ่มโต๊ะ
router.post("/:canteenId/tables", async (req, res) => {
  try {
    const { number, status, reserver, reservationTime } = req.body;
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ error: "Canteen not found" });

    canteen.tables.push({ number, status, reserver, reservationTime });
    await canteen.save();
    res.status(201).json(canteen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงโรงอาหารทั้งหมด
router.get("/", async (req, res) => {
  try {
    const canteens = await Canteen.find();
    res.json(canteens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงโรงอาหารแต่ละที่
router.get("/:canteenId", async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ error: "Canteen not found" });
    res.json(canteen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
