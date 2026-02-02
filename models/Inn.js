// models/Inn.js
const mongoose = require("mongoose");

const InnSchema = new mongoose.Schema(
  {
    canteenID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Canteen",
      required: true,
    },
    innNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: "none",
    },
    type: {
      type: String,
      enum: ["food", "drink", "storage", "none"],
      default: "none",
    },
    queueCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    arduinoSensor: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ป้องกันร้านเลขซ้ำในโรงอาหารเดียวกัน
InnSchema.index({ canteenID: 1, innNumber: 1 }, { unique: true });

module.exports = mongoose.model("Inn", InnSchema);


