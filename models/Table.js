const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    zoneID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Zone",
      required: true 
    },
    number: { type: String, required: true },
    arduinoSensor: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ["Available", "Reserved", "Unavailable"], 
      default: "Available" 
    },
    qr_code_token: { type: String }
  },
  {
    collection: "tables",      // 👈 ชื่อ collection ใน MongoDB Atlas
    timestamps: true
  }
);

export default mongoose.model("Table", tableSchema);
