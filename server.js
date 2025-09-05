

const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./db");
const authRoutes = require("./routes/auth");

const app = express();

app.use(express.json());
connectDB();

app.get("/", async (req, res) => {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log("MongoDB connected");
    }
    res.send("Hello from Vercel API + MongoDB!");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(500).send("MongoDB connection failed");
  }
});

app.use("/api", authRoutes);

module.exports = app;

