// jobs/expireReservations.js
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");

async function expireReservations() {
  try {
    const now = Date.now(); // เวลาเป็น ms

    // ดึงเฉพาะ pending reservations
    const reservations = await Reservation.find({ status: "pending" });

    // filter reservation ที่หมดเวลา
    const expiredReservations = reservations.filter(reservation => {
      const reservedTime = reservation.reserved_at.getTime();
      const durationMs = reservation.duration_minutes * 60 * 1000;
      return reservedTime + durationMs <= now;
    });

    for (const reservation of expiredReservations) {
      reservation.status = "expired";
      await reservation.save();

      const table = await Table.findById(reservation.tableID);
      if (table) {
        table.status = "Available";
        await table.save();
      }

      console.log(`✅ Expired reservation: ${reservation._id}`);
    }

    if (expiredReservations.length === 0) {
      console.log("⏱ No reservations to expire at this time.");
    }

  } catch (err) {
    console.error("Expire job error:", err);
  }
}

// รันทุก 1 นาที
setInterval(expireReservations, 60 * 1000);

// Export เผื่ออยากเรียกแบบ manual
module.exports = expireReservations;
