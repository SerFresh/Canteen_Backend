const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const userProfileRoutes = require("./routes/userprofile");
const canteenRoutes = require("./routes/canteen");
const reservationRoutes = require("./routes/reservation");
const tablesRoutes = require("./routes/table");
const innsRoutes = require("./routes/inn");
const menuRoutes = require("./routes/menu");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://canteen-frontend-one.vercel.app"
  ],
  credentials: true
}));

// Connect MongoDB
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    require("./jobs/expireReservations");
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => res.send("Hello from Render API + MongoDB!"));
app.use("/api/auth", authRoutes);
app.use("/api/user", userProfileRoutes);
app.use("/api/canteen", canteenRoutes);
app.use("/api/reservation", reservationRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/inns", innsRoutes);
app.use("/api/menus", menuRoutes);

// Start server (Render ต้องการตรงนี้)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});