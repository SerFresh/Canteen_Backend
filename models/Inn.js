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
    },
    type: {
      type: String,
      enum: ["food", "drink","storage"],
      required: true,
    },
    arduinoSensor: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Open", "Close"],
      default: "Close",
    },
  },
  { timestamps: true }
);

// ป้องกันร้านเลขซ้ำในโรงอาหารเดียวกัน
InnSchema.index({ canteenID: 1, innNumber: 1 }, { unique: true });

module.exports = mongoose.model("Inn", InnSchema);

