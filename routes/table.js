const express = require("express");
const isAuthenticated = require("../middleware/auth");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

const router = express.Router();
// ค่า duration ที่ backend ยอมรับ (enum)
const ALLOWED_DURATIONS = [30, 45, 60, 90];
const DEFAULT_DURATION = 60;

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

/**
 
PUT /api/tables/:tableId/checkin
Scan QR ของโต๊ะ → check-in*/
router.put("/:tableId/checkin", isAuthenticated, async (req, res) => {
  const { tableId } = req.params;
  const userId = req.user.id;

  try {
    // หาโต๊ะจาก tableId หรือ qr_code_token
    const table = await Table.findOne({
      $or: [{ _id: tableId }, { qr_code_token: tableId }],
    });
    if (!table) return res.status(404).json({ message: "Table not found" });

    // หา reservation ของ user ปัจจุบัน
    let reservation = await Reservation.findOne({
      tableID: table._id,
      userID: userId,
      status: { $in: ["Reserved", "confirmed"] },
    });

    // ถ้าไม่มี reservation → สร้างชั่วคราว
    if (!reservation) {
      reservation = new Reservation({
        tableID: table._id,
        userID: userId,
        status: "confirmed",
        reserved_at: new Date(),
        duration_minutes: ALLOWED_DURATIONS.includes(DEFAULT_DURATION)
          ? DEFAULT_DURATION
          : ALLOWED_DURATIONS[0],
      });
      await reservation.save();
    } else {
      // ถ้ามี reservation → อัปเดตเป็น confirmed
      reservation.status = "confirmed";
      await reservation.save();
    }

    // อัปเดตโต๊ะ
    table.status = "Unavailable";
    table.arduinoSensor = false;
    await table.save();

    res.json({
      message: "เช็คอินสำเร็จ",
      reservationId: reservation._id,
      tableId: table._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;