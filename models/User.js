const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  imageProfile: { type: String },
  verified: { type: Boolean, default: false }, // ✅ ฟิลด์ใหม่
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now } // ✅ ต้องมี เพื่อ TTL index
});

// ✅ TTL index: ลบ 5 นาทีหลังสร้างเฉพาะ user ที่ verified = false
UserSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 300, partialFilterExpression: { verified: false } }
);

module.exports = mongoose.model("User", UserSchema, "users");