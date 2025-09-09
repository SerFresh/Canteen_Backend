// models/Canteen.js
const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  number: { type: Number, required: true },  // หมายเลขโต๊ะ
  status: { 
    type: String, 
    enum: ["Available", "Unavailable", "Reserved"], 
    default: "Available" 
  }
});

const CanteenSchema = new mongoose.Schema({
  C_name: { type: String, required: true }, // ชื่อโรงอาหาร
  Capacity: { type: Number, required: true }, // จำนวนโต๊ะทั้งหมด
  C_Status: { 
    type: String, 
    enum: ["High", "Medium", "Normal"], 
    default: "Normal" 
  },
  Zone: [{ type: String }], // array ของโซน เช่น ["A","B","C"]
  Tables: [TableSchema] // array ของโต๊ะแต่ละตัว
}, {
  collection: "canteens"
});

module.exports = mongoose.model("Canteen", CanteenSchema);
