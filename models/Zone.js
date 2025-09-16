const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    canteenID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Canteen",
      required: true 
    },
    name: { type: String, required: true }
  },
  {
    collection: "zones",      // 👈 ชื่อ collection ใน MongoDB Atlas
    timestamps: true
  }
);

export default mongoose.model("Zone", zoneSchema);
