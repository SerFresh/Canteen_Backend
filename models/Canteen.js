// models/Canteen.js
const mongoose = require("mongoose");

const CanteenSchema = new mongoose.Schema({
  C_ID: { type: String, required: true, unique: true },
  C_name: { type: String, required: true },
  Capacity: { type: Number, required: true },
  Table: { type: Number, default: 0 }, // จำนวนโต๊ะ Unavailable
  C_Status: { type: String, enum: ["High", "Medium", "Normal"], default: "Normal" },
}, {
  collection: "canteens" // กำหนดชื่อ collection ใน MongoDB
});

module.exports = mongoose.model("Canteen", CanteenSchema);
