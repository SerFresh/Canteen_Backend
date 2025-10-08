const express = require("express");
const isAuthenticated = require("../middleware/auth");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

const router = express.Router();

// ✅ PATCH /api/tables/:id/status
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

// ✅ GET /api/tables/:id/sensor
router.get("/:id/sensor", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).select("arduinoSensor");
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ arduinoSensor: table.arduinoSensor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PATCH /api/tables/:id/sensor
router.patch("/:id/sensor", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found" });

    if (table.status === "Reserved") {
      table.arduinoSensor = true;
      await table.save();
      return res.json({
        message: "Sensor disabled because table is reserved",
        arduinoSensor: table.arduinoSensor,
      });
    }

    res.json({
      message: "Table is not reserved, sensor remains active",
      arduinoSensor: table.arduinoSensor,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /api/tables/:id/status
router.get("/:id/status", async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).select("status");
    if (!table) return res.status(404).json({ message: "Table not found" });

    res.json({ status: table.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT /api/tables/:tableId/checkin
router.put("/:tableId/checkin", isAuthenticated, async (req, res) => {
  const { tableId } = req.params;
  const userId = req.user.id;

  try {
    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    const reservation = await Reservation.findOne({
      tableID: tableId,
      status: "Reserved",
    });
    if (!reservation)
      return res.status(404).json({ message: "No active reservation for this table" });

    if (reservation.userID.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to check-in this table" });
    }

    reservation.status = "confirmed";
    await reservation.save();

    table.status = "Unavailable";
    table.arduinoSensor = false;
    await table.save();

    res.json({
      message: "Check-in successful",
      reservationId: reservation._id,
      tableId: table._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

module.exports = router;
