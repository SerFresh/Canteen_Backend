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
      Zone: Zone || []   // ✅ เก็บ zone
    });

    await newCanteen.save();
    res.status(201).json({ message: "Canteen created", canteen: newCanteen });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
