const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const reservationSchema = new mongoose.Schema(
  {
    tableID: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reserved_at: { type: Date, default: Date.now },
    checkin_at: { type: Date },
    duration_minutes: { type: Number, required: true, enum: [5, 10, 15] },
    status: {
      type: String,
      enum: ["pending", "confirmed", "expired", "cancelled"],
      default: "pending",
    },
    qr_code_token: { type: String, default: () => uuidv4() },
  },
  { collection: "reservations", timestamps: true }
);

// 🔒 กันผู้ใช้จองซ้อน 100%
reservationSchema.index(
  { userID: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending"] },
    },
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);

