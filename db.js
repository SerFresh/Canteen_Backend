const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return; // reuse existing connection
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = connectDB;
