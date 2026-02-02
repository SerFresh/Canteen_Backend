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


/* ---------- CHECK-IN ---------- */
// router.put("/:tableId/checkin", isAuthenticated, async (req, res) => {
//   try {
//     const table = await Table.findById(req.params.tableId);
//     if (!table) return res.status(404).json({ message: "Table not found" });

//     // หา reservation ของผู้ใช้สำหรับโต๊ะนี้ ที่ยัง pending
//     const reservation = await Reservation.findOne({
//       tableID: table._id,
//       userID: req.user._id,
//       status: "pending"
//     });

//     // โต๊ะ Reserved → ให้ผู้จอง check-in ได้
//     if (table.status === "Reserved") {
//       if (!reservation) {
//         return res.status(403).json({ message: "You do not have a reservation for this table" });
//       }

//       reservation.status = "confirmed";
//       reservation.checkin_at = new Date();
//       await reservation.save();

//       table.status = "Unavailable";
//       table.arduinoSensor = false; // เปิดเซนเซอร์
//       await table.save();

//       return res.json({ message: "Check-in confirmed", reservation });
//     }

//     // โต๊ะ Available หรือ Unavailable → เปลี่ยนเป็น Unavailable
//     if (table.status === "Available" || table.status === "Unavailable") {
//       table.status = "Unavailable";
//       table.arduinoSensor = true; // เซนเซอร์ยังไม่ทำงาน
//       await table.save();
//       return res.json({ message: "Table is now marked as unavailable until cancelled" });
//     }

//     res.status(400).json({ message: "Cannot check-in" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.put("/:tableId/activate", isAuthenticated, async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    // เปิดโต๊ะกลับเป็น Available เฉพาะกรณีที่โต๊ะถูกบล็อก
    if (table.status === "Unavailable") {
      table.status = "Available";
      table.arduinoSensor = false; // เปิดเซนเซอร์ด้วย
      await table.save();

      // ส่งคำสั่งไปเซนเซอร์จริง เช่น MQTT, API, GPIO
      // sendToSensor(table.id, "activate");

      return res.json({ message: "Table is now available and sensor activated", table });
    }

    // ถ้าโต๊ะไม่ใช่ Unavailable → ไม่มีอะไรต้องทำ
    res.status(400).json({ message: "Table is not blocked" });
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
