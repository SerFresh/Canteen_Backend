const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String },
  email: { type: String, required: true, unique: true },

  // ❗ password ไม่ required แล้ว
  password: { type: String },

  imageProfile: { type: String },

  // 🔹 เพิ่ม
  provider: { type: String, enum: ["local", "google"], default: "local" },
  googleId: { type: String },

  verified: { type: Boolean, default: false },

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: { type: Date, default: Date.now }
});

// TTL index: ลบ user local ที่ยังไม่ verify
UserSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 300, partialFilterExpression: { verified: false, provider: "local" } }
);

module.exports = mongoose.model("User", UserSchema, "users");
