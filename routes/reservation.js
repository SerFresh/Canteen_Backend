const express = require("express");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const isAuthenticated = require("../middleware/auth");
const router = express.Router();

/* ---------- CREATE RESERVATION ---------- */
router.post("/:tableId", isAuthenticated, async (req, res) => {
  try {
    const { duration_minutes } = req.body;
    const userID = req.user?._id;
    const tableID = req.params.tableId;

    if (!userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (![5, 10, 15].includes(duration_minutes)) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    // 🔍 เช็คเชิง logic (UX)
    const existingReservation = await Reservation.findOne({
      userID,
      status: { $in: ["pending"] },
    });

    if (existingReservation) {
      return res.status(400).json({
        message: "You already have an active reservation",
      });
    }

    // 🔒 ล็อกโต๊ะ
    const table = await Table.findOneAndUpdate(
      { _id: tableID, status: "Available" },
      { status: "Reserved", arduinoSensor: true },
      { new: true }
    );

    if (!table) {
      return res.status(400).json({ message: "Table not available" });
    }

    // 📝 CREATE (จุดที่อาจโดน 11000)
    const reservation = await Reservation.create({
      tableID,
      userID,
      duration_minutes,
      status: "pending",
    });

    return res.status(201).json({
      message: "Reservation created",
      reservation,
    });
  } catch (err) {
    // 👇 ใส่ตรงนี้
    if (err.code === 11000) {
      return res.status(400).json({
        message: "You already have an active reservation",
      });
    }

    res.status(500).json({ error: err.message });
  }
});


/* ---------- mark โต๊ะ ---------- */
router.put("/:tableId/mark", isAuthenticated, async (req, res) => {
  const { tableId } = req.params;
  
    try {
      // 1️⃣ หาโต๊ะ (จาก id หรือ qr token)
      const table = await Table.findOne({
        $or: [{ _id: tableId }, { qr_code_token: tableId }],
      });

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.status === "Reserved") {
      return res.status(400).json({
        message: "Table already reserved",
      });
    }

    table.status = "Unavailable";
    table.arduinoSensor = true;
    table.blockedBy = req.user._id;

    await table.save();

    res.json({
      message: "Table blocked successfully",
      table,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:tableId/activate", isAuthenticated, async (req, res) => {
    const { tableId } = req.params;
  
    try {
      // 1️⃣ หาโต๊ะ (จาก id หรือ qr token)
      const table = await Table.findOne({
        $or: [{ _id: tableId }, { qr_code_token: tableId }],
      });

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.status !== "Unavailable") {
      return res.status(400).json({
        message: "Table is not blocked",
      });
    }

    // 🔐 เช็คว่าเป็นคน block หรือไม่
    if (
      !table.blockedBy ||
      table.blockedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot unblock this table",
      });
    }

    table.arduinoSensor = false;
    table.blockedBy = null;

    await table.save();

    res.json({
      message: "Table unblocked successfully",
      table,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CANCEL ---------- */
router.put("/:reservationId/cancel", isAuthenticated, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (!reservation.userID.equals(req.user._id)) {
      return res.status(403).json({ message: "Not your reservation" });
    }
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    if (reservation.status !== "pending") return res.status(400).json({ message: "Cannot cancel" });

    reservation.status = "cancelled";
    await reservation.save();

    const table = await Table.findById(reservation.tableID);
    table.status = "Available";
    table.arduinoSensor = false;
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
