const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Vercel API!");
});

app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

module.exports = app;
