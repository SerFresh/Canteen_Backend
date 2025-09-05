// server.js
const express = require("express");
const connectDB = require("./db"); // ไฟล์เชื่อม MongoDB
const app = express();

app.use(express.json());

// connect MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Hello from Vercel API + MongoDB!");
});

app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

// Export app แทนการ listen()
module.exports = app;
