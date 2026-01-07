// models/InnName.js
const mongoose = require("mongoose");

const InnNameSchema = new mongoose.Schema(
  {
    innID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inn",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["food", "drink"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InnName", InnNameSchema);

