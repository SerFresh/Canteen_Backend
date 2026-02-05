// models/Table.ts
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    zoneID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Zone", 
      required: true 
    },

    number: { 
      type: String, 
      required: true 
    },

    arduinoSensor: { 
      type: Boolean, 
      default: false 
    },

    status: { 
      type: String, 
      enum: ["Available", "Reserved", "Unavailable"], 
      default: "Available" 
    },

    // 👇 เพิ่ม: ใครเป็นคนบล็อกโต๊ะ
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    qr_code_token: { 
      type: String, 
      default: function () {
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
