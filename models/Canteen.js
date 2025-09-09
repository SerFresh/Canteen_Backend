const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  status: { type: String, enum: ["available", "unavailable", "reserved"], default: "available" },
  reserver: { type: String, default: "" },
  reservationTime: { type: Date, default: null }
});

const CanteenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zones: [{ type: String }],
  tables: [TableSchema]
}, { collection: "canteens" }); // กำหนดชื่อ collection

module.exports = mongoose.model("Canteen", CanteenSchema);
