// models/Menu.js
const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema(
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
    price: {
      type: String,
      required: true,
      min: 0,
    },
    like: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", MenuSchema);

