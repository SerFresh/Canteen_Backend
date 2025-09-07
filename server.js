// server.js
const express = require("express");
const cors = require("cors"); 
const connectDB = require("./db"); // ไฟล์เชื่อม MongoDB
const serverless = require("serverless-http");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const userProfileRoutes = require("./routes/userprofile");

const app = express();
app.use(express.json());

// CORS configuration
// อนุญาตทุก origin (dev) หรือใส่เฉพาะ frontend URL ของคุณ
app.use(
  cors({
    origin: ["http://localhost:5173"], // หรือ "*" ถ้าต้องการอนุญาตทุกที่
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

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
app.use("/api/user", userProfileRoutes);

// Export app แทนการ listen()
module.exports = app;
module.exports.handler = serverless(app);

