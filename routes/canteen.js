const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");

// --- CREATE โรงอาหาร ---
router.post("/", async (req, res) => {
  try {
    const { name, zones } = req.body; // zones: [{name, tables: [{number,status}]}]
    const newCanteen = new Canteen({ name, zones });
    await newCanteen.save();
    res.status(201).json(newCanteen);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- GET โรงอาหารทั้งหมด ---
router.get("/", async (req, res) => {
  try {
    const canteens = await Canteen.find();
    res.json(canteens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET โรงอาหารเฉพาะที่ และแสดงรายละเอียดโต๊ะ ---
router.get("/:canteenId", async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ error: "Canteen not found" });
    res.json(canteen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADD โต๊ะใหม่ในโซน ---
router.post("/:canteenId/zones/:zoneName/tables", async (req, res) => {
  try {
    const { number, status } = req.body;
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ error: "Canteen not found" });

    const zone = canteen.zones.find(z => z.name === req.params.zoneName);
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    zone.tables.push({ number, status });
    await canteen.save();
    res.status(201).json(zone.tables);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- UPDATE โต๊ะ ---
router.put("/:canteenId/zones/:zoneName/tables/:tableNumber", async (req, res) => {
  try {
    const { status, reservedBy, reservedTime } = req.body;
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ error: "Canteen not found" });

    const zone = canteen.zones.find(z => z.name === req.params.zoneName);
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    const table = zone.tables.find(t => t.number === req.params.tableNumber);
    if (!table) return res.status(404).json({ error: "Table not found" });

    if (status) table.status = status;
    if (reservedBy !== undefined) table.reservedBy = reservedBy;
    if (reservedTime) table.reservedTime = reservedTime;

    await canteen.save();
    res.json(table);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;