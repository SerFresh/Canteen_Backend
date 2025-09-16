const Reservation = require("../models/Reservation");
const Table = require("../models/Table");

async function expireReservations() {
  try {
    const now = new Date();

    // หา reservations ที่ pending และเลยเวลาหมดอายุแล้ว
    const expiredReservations = await Reservation.find({
      status: "pending",
      $expr: {
        $lt: [
          { $add: ["$reserved_at", { $multiply: ["$duration_minutes", 60000] }] },
          now
        ]
      }
    });

    for (const reservation of expiredReservations) {
      reservation.status = "expired";
      await reservation.save();

      const table = await Table.findById(reservation.tableID);
      if (table) {
        table.status = "Available";
        await table.save();
      }

      console.log(`Expired reservation: ${reservation._id}`);
    }
  } catch (err) {
    console.error("Expire job error:", err);
  }
}

// รันทุก 1 นาที
setInterval(expireReservations, 60 * 1000);

module.exports = expireReservations;
