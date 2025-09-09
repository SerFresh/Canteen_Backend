// routes/canteen.js
const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");

// POST /canteen
router.post("/", async (req, res) => {
  try {
    const { C_name, Capacity, C_Status, Zone } = req.body;

    const newCanteen = new Canteen({
      C_name,
      Capacity,
      C_Status,
      Table: 0,
      Zone: Zone || []   // เก็บ zone
    });

    await newCanteen.save();
    res.status(201).json({ message: "Canteen created", canteen: newCanteen });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ GET /canteen → ดึงข้อมูลโรงอาหารทั้งหมด
router.get("/", async (req, res) => {
  try {
    const canteens = await Canteen.find();
    res.json(canteens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ GET /canteen/:id → ดูข้อมูลโรงอาหารทีละตัว
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

module.exports = router;