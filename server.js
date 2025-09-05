const express = require("express");
const connectDB = require("./db");

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    await connectDB(); // เชื่อม DB
    res.send("Hello from Vercel API + MongoDB!");
  } catch (err) {
    res.status(500).send("MongoDB connection failed");
  }
});

app.get("/ping", async (req, res) => {
  try {
    await connectDB();
    res.json({ message: "pong" });
  } catch (err) {
    res.status(500).json({ message: "MongoDB connection failed" });
  }
});

module.exports = app;
