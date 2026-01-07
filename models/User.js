const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nickname: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // 🔒 ไม่ return password อัตโนมัติ
    },
    imageProfile: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "chef"],
      default: "user",
    },

    // 🔑 reset password
    resetPasswordToken: String,
    resetPasswordExpires: {
      type: Date,
      index: { expires: 0 }, // ⏱ TTL index
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

module.exports = mongoose.model("User", UserSchema, "users");
