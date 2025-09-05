require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");

const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// Routes
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => res.json({ message: "Server is running!" }));

app.get("/", (req, res) => res.send("Backend is running!"));

// ✅ ถ้ารันปกติด้วย node server.js
if (process.env.NODE_ENV !== "serverless") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ✅ export ไว้สำหรับ serverless (vercel, netlify)
module.exports.handler = serverless(app);
