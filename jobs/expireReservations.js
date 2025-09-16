const cron = require("node-cron");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  const expiredReservations = await Reservation.find({
    status: "pending",
    expireAt: { $lt: now }
  });

  for (const resv of expiredReservations) {
    resv.status = "expired";
    await resv.save();

    const table = await Table.findById(resv.tableID);
    if (table) {
      table.status = "Available";
      await table.save();
    }
  }
  if (expiredReservations.length > 0) {
    console.log(`Expired ${expiredReservations.length} reservations`);
  }
});
