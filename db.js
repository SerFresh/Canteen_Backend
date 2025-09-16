// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return; // ใช้ connection เดิมถ้ามี
  try {
    await mongoose.connect(process.env.MONGO_URI); // ไม่ต้องใส่ useNewUrlParser
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

module.exports = connectDB;
