// models/Table.ts
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    zoneID: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    number: { type: String, required: true },
    arduinoSensor: { type: Boolean, default: false },
    status: { type: String, enum: ["Available", "Reserved", "Unavailable"], default: "Available" },
    qr_code_token: { 
      type: String, 
      default: function () {
        // ถ้าไม่ได้กำหนด QR token เอง ให้ใช้ _id เป็นค่าเริ่มต้น
        return this._id.toString();
      }
    }
  },
  {
    collection: "tables",
    timestamps: true
  }
);

module.exports = mongoose.model("Table", tableSchema);