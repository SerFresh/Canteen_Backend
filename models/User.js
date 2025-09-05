const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  imageProfile: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
