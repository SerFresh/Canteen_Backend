// require('dotenv').config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const serverless = require("serverless-http");

// const authRoutes = require("./routes/auth");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// const connectDB = async () => {
//   try {
//     if (mongoose.connections[0].readyState) return; // reuse connection
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log("✅ MongoDB connected");
//   } catch (err) {
//     console.error("❌ MongoDB Error:", err.message);
//   }
// };

// connectDB();

// // Routes
// app.use("/api/auth", authRoutes);

// app.get("/api/health", (req, res) => res.json({ message: "Server is running!" }));
// app.get("/", (req, res) => res.send("Backend is running!"));

// // 👉 ใช้กับ Vercel (Serverless)
// module.exports.handler = serverless(app);

// // 👉 ใช้ตอนรัน local
// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });
// }

const express = require("express");
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
