const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  number: { type: String, required: true }, // หมายเลขโต๊ะ
  status: { type: String, enum: ["available", "unavailable", "reserved"], default: "available" },
  reservedBy: { type: String, default: "" }, // ชื่อผู้จอง
  reservedTime: { type: Date } // เวลาการจอง
});

const ZoneSchema = new mongoose.Schema({
  name: { type: String, required: true }, // ชื่อโซน
  tables: [TableSchema] // โต๊ะในโซนนี้
});

const CanteenSchema = new mongoose.Schema({
  name: { type: String, required: true }, // ชื่อโรงอาหาร
  zones: [ZoneSchema] // โซนภายในโรงอาหาร
}, { collection: "canteens" }); // กำหนดชื่อ collection

module.exports = mongoose.model("Canteen", CanteenSchema);
