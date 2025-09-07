// server.js
const express = require("express");
const connectDB = require("./db"); // ไฟล์เชื่อม MongoDB

const User = require("./models/User");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

// connect MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Hello from Vercel API + MongoDB!");
});

// ทดลองดึง user ทั้งหมดจาก mongodb atlas
app.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // ดึงข้อมูลทั้งหมด
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.use("/api/auth", authRoutes);

// Export app แทนการ listen()
module.exports = app;

