// models/Canteen.js
const mongoose = require("mongoose");

const CanteenSchema = new mongoose.Schema({
  C_name: { type: String, required: true }, // ชื่อโรงอาหาร
  Capacity: { type: Number, required: true }, // จำนวนโต๊ะทั้งหมด
  Table: { type: Number, default: 0 }, // จำนวนโต๊ะ Unavailable
  C_Status: { 
    type: String, 
    enum: ["High", "Medium", "Normal"], 
    default: "Normal" 
  },
  Zone: [{ type: String }] // array ของโซน เช่น ["A","B","C"]
}, {
  collection: "canteens" // กำหนดชื่อ collection ใน MongoDB
});

module.exports = mongoose.model("Canteen", CanteenSchema);