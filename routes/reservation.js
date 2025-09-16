const express = require("express");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const isAuthenticated = require("../middleware/auth"); // middleware ตรวจสอบ login
const router = express.Router();

/* ---------- CREATE RESERVATION ---------- */
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { tableID, reserved_at, duration_minutes } = req.body;
    const userID = req.user._id;

    const table = await Table.findById(tableID);
    if (!table) return res.status(404).json({ message: "Table not found" });
    if (table.status !== "Available") return res.status(400).json({ message: "Table is not available" });

    const reservation = await Reservation.create({
      tableID,
      userID,
      reserved_at,
      duration_minutes,
      status: "pending"
    });

    // อัปเดตสถานะโต๊ะเป็น Reserved
    table.status = "Reserved";
    await table.save();

    res.status(201).json({ message: "Reservation created", reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- GET USER RESERVATIONS ---------- */
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userID: req.user._id })
      .populate("tableID")
      .sort({ reserved_at: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- GET ALL RESERVATIONS (ADMIN) ---------- */
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("tableID userID")
      .sort({ reserved_at: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CHECK-IN ---------- */
router.put("/:reservationId/checkin", isAuthenticated, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status !== "pending") return res.status(400).json({ message: "Reservation cannot be checked in" });

    reservation.status = "confirmed";
    reservation.checkin_at = new Date();
    await reservation.save();

    const table = await Table.findById(reservation.tableID);
    table.status = "Unavailable";
    await table.save();

    res.json({ message: "Check-in confirmed", reservation });
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

/* ---------- EXPIRE RESERVATION (CRON / TIMER) ---------- */
router.put("/expire/:qr_code_token", async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ qr_code_token: req.params.qr_code_token });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status !== "pending") return res.status(400).json({ message: "Cannot expire" });

    // ตรวจสอบเวลาหมดอายุ
    const expireTime = new Date(reservation.reserved_at.getTime() + reservation.duration_minutes*60000);
    if (new Date() < expireTime) return res.status(400).json({ message: "Reservation is not expired yet" });

    reservation.status = "expired";
    await reservation.save();

    const table = await Table.findById(reservation.tableID);
    table.status = "Available";
    await table.save();

    res.json({ message: "Reservation expired", reservation });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
