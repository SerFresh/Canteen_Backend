import mongoose from "mongoose";

const canteenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true }
  },
  {
    collection: "canteens",   // 👈 ชื่อ collection ใน MongoDB Atlas
    timestamps: true
  }
);

export default mongoose.model("Canteen", canteenSchema);