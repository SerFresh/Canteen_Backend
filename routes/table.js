const express = require("express");
const router = express.Router();
const Table = require("../models/Table");

// PATCH /api/tables/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { occupied } = req.body; // true = มีคน, false = ไม่มีคน

    if (typeof occupied !== "boolean") {
      return res.status(400).json({ message: "occupied (boolean) is required" });
    }

    const newStatus = occupied ? "Unavailable" : "Available";

    const updated = await Table.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Table not found" });

    res.json({
      message: `Table status updated to ${newStatus}`,
      table: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tables/:id/sensor
router.get("/:id/sensor", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).select("arduinoSensor");
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ arduinoSensor: table.arduinoSensor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH เพื่ออัปเดตสถานะเซนเซอร์
router.patch("/:id/sensor", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    // ถ้าโต๊ะถูกจอง ให้ปิดเซนเซอร์
    if (table.status === "Reserved") {
      table.arduinoSensor = True; // ปิดเซนเซอร์
      await table.save();
      return res.json({
        message: "Sensor disabled because table is reserved",
        arduinoSensor: table.arduinoSensor,
      });
    }

    // ถ้าโต๊ะไม่ได้ถูกจอง อาจเลือกเปิดใช้งานเซนเซอร์
    res.json({
      message: "Table is not reserved, sensor remains active",
      arduinoSensor: table.arduinoSensor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/tables/:id/status
router.get("/:id/status", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).select("status");
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ status: table.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
