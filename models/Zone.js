const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    canteenID: { type: mongoose.Schema.Types.ObjectId, ref: "Canteen", required: true },
    name: { type: String, required: true }
  },
  {
    collection: "zones",
    timestamps: true
  }
);

module.exports = mongoose.model("Zone", zoneSchema);