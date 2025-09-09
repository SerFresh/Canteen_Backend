// models/Table.js
const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  T_ID: { type: String, required: true, unique: true },
  C_ID: { type: String, required: true }, // foreign key to Canteen
  T_Status: { type: String, enum: ["Available", "Unavailable", "Reserved"], default: "Available" },
  TimeReserve: { type: Date },
  Reserver: { type: String },
});

module.exports = mongoose.model("Table", TableSchema);
