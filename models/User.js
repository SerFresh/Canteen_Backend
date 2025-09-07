const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nicname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  imageProfile: { type: String },
  verified: { type: Boolean, default: false } // ✅ ฟิลด์ใหม่
});

module.exports = mongoose.model("User", UserSchema, "users");
