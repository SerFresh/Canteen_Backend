const express = require("express");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const isAuthenticated = require("../middleware/auth");
const router = express.Router();

/* ---------- CREATE RESERVATION ---------- */
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { tableID, duration_minutes } = req.body;
    const userID = req.user._id;

    if (!userID) return res.status(500).json({ message: "userID missing" });

    const table = await Table.findById(tableID);
    if (!table) return res.status(404).json({ message: "Table not found" });
    if (table.status !== "Available") return res.status(400).json({ message: "Table not available" });

    const reservation = await Reservation.create({
      tableID,
      userID,
      duration_minutes,
      reserved_at: new Date()
    });

    table.status = "Reserved";
    await table.save();

    res.status(201).json({ message: "Reservation created", reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CHECK-IN ---------- */
router.put("/:tableId/checkin", isAuthenticated, async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    // หา reservation ของผู้ใช้สำหรับโต๊ะนี้ ที่ยัง pending
    const reservation = await Reservation.findOne({
      tableID: table._id,
      userID: req.user._id,
      status: "pending"
    });

    // โต๊ะ Reserved → ให้ผู้จอง check-in ได้
    if (table.status === "Reserved") {
      if (!reservation) {
        return res.status(403).json({ message: "You do not have a reservation for this table" });
      }

      reservation.status = "confirmed";
      reservation.checkin_at = new Date();
      await reservation.save();

      table.status = "Unavailable";
      await table.save();

      return res.json({ message: "Check-in confirmed", reservation });
    }

    // โต๊ะ Available หรือ Unavailable → แจ้งว่าโต๊ะยังไม่พร้อม
    if (table.status === "Available" || table.status === "Unavailable") {
      return res.status(400).json({ message: "Table is currently unavailable" });
    }

    res.status(400).json({ message: "Cannot check-in" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CANCEL ---------- */
router.put("/:reservationId/cancel", isAuthenticated, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status !== "pending") return res.status(400).json({ message: "Cannot cancel" });

    reservation.status = "cancelled";
    await reservation.save();

    const table = await Table.findById(reservation.tableID);
    table.status = "Available";
    await table.save();

    res.json({ message: "Reservation cancelled", reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- GET USER RESERVATIONS ---------- */
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userID: req.user._id }).populate("tableID").sort({ reserved_at: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
