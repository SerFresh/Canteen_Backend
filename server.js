// server.js
const express = require("express");
const cors = require("cors"); 
const connectDB = require("./db"); 
const serverless = require("serverless-http");

const authRoutes = require("./routes/auth");
const userProfileRoutes = require("./routes/userprofile");
const canteenRoutes = require("./routes/canteen");

const app = express();
app.use(express.json());

// CORS
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Connect MongoDB
(async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
})();

// Routes
app.get("/", (req, res) => res.send("Hello from Vercel API + MongoDB!"));

app.get("/users", async (req, res) => {
  try {
    const User = require("./models/User");
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userProfileRoutes);
app.use("/api/canteen", canteenRoutes);

// Export app สำหรับ serverless
module.exports = app;
module.exports.handler = serverless(app);
