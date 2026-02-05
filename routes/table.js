const express = require("express");
const isAuthenticated = require("../middleware/auth");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

const router = express.Router();
// ค่า duration ที่ backend ยอมรับ (enum)
const ALLOWED_DURATIONS = [5, 10, 15]; // enum เดิม
const DEFAULT_DURATION = 10; // ค่าเดิมที่อาจไม่อยู่ใน enum

// ก่อนสร้าง reservation
const duration = ALLOWED_DURATIONS.includes(DEFAULT_DURATION)
  ? DEFAULT_DURATION
  : ALLOWED_DURATIONS[0]; // ถ้า DEFAULT ไม่อยู่ ใช้ค่าแรกใน enum


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
Scan QR ของโต๊ะ → check-in
*/
router.put("/:tableId/checkin", isAuthenticated, async (req, res) => {
  const { tableId } = req.params;
  const userId = req.user._id;

  try {
    // 1️⃣ หาโต๊ะ (จาก id หรือ qr token)
    const table = await Table.findOne({
      qr_code_token: tableId,
    });

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // 2️⃣ หา reservation ที่ยัง pending ของ user นี้
    const reservation = await Reservation.findOne({
      tableID: table._id,
      userID: userId,
      status: "pending",
    });

    if (!reservation) {
      return res.status(400).json({
        message: "No pending reservation found for this table",
      });
    }

    // 3️⃣ เช็คอิน → อัปเดต reservation
    reservation.status = "confirmed";
    reservation.checkin_at = new Date();
    await reservation.save();

    // 4️⃣ อัปเดตโต๊ะ
    table.status = "Unavailable";
    table.arduinoSensor = false;
    await table.save();

    // 5️⃣ ตั้งเวลา expire อัตโนมัติ (ตาม duration)
    setTimeout(async () => {
      try {
        const r = await Reservation.findById(reservation._id);
        const t = await Table.findById(table._id);

        if (r && r.status === "confirmed") {
          r.status = "expired";
          await r.save();
        }

        if (t) {
          t.status = "Available";
          t.arduinoSensor = false;
          await t.save();
        }
      } catch (err) {
        console.error("Auto-expire failed:", err);
      }
    }, reservation.duration_minutes * 60 * 1000);

    return res.json({
      message: "เช็คอินสำเร็จ",
      reservationId: reservation._id,
      tableId: table._id,
      expiredInMinutes: reservation.duration_minutes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});



module.exports = router;