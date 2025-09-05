// server.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userprofile');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ Mongo Error:", err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Root route
app.get('/', (req, res) => {
  res.send('Backend is running! Visit /api/health for JSON.');
});

// Export serverless handler
module.exports.handler = serverless(app);
