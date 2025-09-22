// db.js
const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn; // ใช้ connection เดิม
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // รอ MongoDB ตอบกลับไม่เกิน 10 วิ
      socketTimeoutMS: 45000,          // ป้องกัน socket ค้าง
    }).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // ถ้า fail ให้ reset ไม่งั้นจะติด cache error
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
