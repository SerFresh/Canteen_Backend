// server.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http"); // สำหรับ Vercel

const app = express();
app.use(cors());
app.use(express.json());

// ✅ เชื่อม MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// ✅ ตัวอย่าง Model
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: String,
  password: String,
}));

// ✅ Routes
app.get("/", (req, res) => {
  res.send("Backend is running! Visit /api/health");
});

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.post("/api/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 สำหรับ Vercel ต้อง export handler
module.exports.handler = serverless(app);

// ✅ ถ้า run local ให้ใช้ app.listen
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
