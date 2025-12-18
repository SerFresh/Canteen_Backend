const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  imageProfile: { type: String },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now } // ✅ ต้องมี เพื่อ TTL index
});


module.exports = mongoose.model("User", UserSchema, "users");