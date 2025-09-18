const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const connectDB = require("./db");

const authRoutes = require("./routes/auth"); // มีอยู่แล้ว
const userProfileRoutes = require("./routes/userprofile"); // มีอยู่แล้ว
const canteenRoutes = require("./routes/canteen");
const reservationRoutes = require("./routes/reservation");
const tablesRoutes = require("./routes/table");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

// Connect MongoDB ก่อน router
connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => res.send("Hello from Vercel API + MongoDB!"));
app.use("/api/auth", authRoutes);
app.use("/api/user", userProfileRoutes);
app.use("/api/canteen", canteenRoutes);
app.use("/api/reservation", reservationRoutes);
app.use("/api/tables", tablesRoutes);

// Export serverless handler
module.exports = app;
module.exports.handler = serverless(app);
