const express = require("express");
const Canteen = require("../models/Canteen.js");
const Zone = require("../models/Zone.js");
const Table = require("../models/Table.js");

const router = express.Router();

/* -------------------- 🏢 CANTEEN -------------------- */

// POST - สร้างโรงอาหารใหม่
router.post("/", async (req, res) => {
  try {
    const { name, location } = req.body;
    const newCanteen = new Canteen({ name, location });
    await newCanteen.save();
    res.status(201).json({ message: "Canteen created successfully", canteen: newCanteen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - เรียกโรงอาหารทั้งหมด
router.get("/", async (req, res) => {
  try {
    const canteens = await Canteen.find();
    res.json(canteens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - แก้ไขข้อมูลโรงอาหาร
router.put("/:canteenId", async (req, res) => {
  try {
    const { name, location } = req.body;
    const updated = await Canteen.findByIdAndUpdate(
      req.params.canteenId,
      { name, location },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Canteen not found" });
    res.json({ message: "Canteen updated successfully", canteen: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* -------------------- 🗺️ ZONE -------------------- */

// POST - เพิ่ม Zone
router.post("/:canteenId/zones", async (req, res) => {
  try {
    const { name } = req.body;
    const { canteenId } = req.params;

    const canteen = await Canteen.findById(canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const newZone = new Zone({ name, canteenID: canteenId });
    await newZone.save();

    res.status(201).json({ message: "Zone created successfully", zone: newZone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - แก้ไข Zone
router.put("/:canteenId/zones/:zoneId", async (req, res) => {
  try {
    const { name } = req.body;
    const updatedZone = await Zone.findByIdAndUpdate(
      req.params.zoneId,
      { name },
      { new: true }
    );
    if (!updatedZone) return res.status(404).json({ message: "Zone not found" });

    res.json({ message: "Zone updated successfully", zone: updatedZone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* -------------------- 🍽️ TABLE -------------------- */

// POST - เพิ่ม Table
router.post("/:canteenId/zones/:zoneId/tables", async (req, res) => {
  try {
    const { number, arduinoSensor, status, qr_code_token } = req.body;

    const zone = await Zone.findById(req.params.zoneId);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    const newTable = new Table({
      number,
      arduinoSensor,
      status,
      qr_code_token,
      zoneID: req.params.zoneId
    });
    await newTable.save();

    res.status(201).json({ message: "Table created successfully", table: newTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - แก้ไข Table
router.put("/:canteenId/zones/:zoneId/tables/:tableId", async (req, res) => {
  try {
    const { number, arduinoSensor, status } = req.body;

    const updatedTable = await Table.findByIdAndUpdate(
      req.params.tableId,
      { number, arduinoSensor, status },
      { new: true }
    );
    if (!updatedTable) return res.status(404).json({ message: "Table not found" });

    res.json({ message: "Table updated successfully", table: updatedTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* -------------------- 📦 GET FULL STRUCTURE -------------------- */

// GET - Canteen + Zones + Tables
router.get("/:canteenId", async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const zones = await Zone.find({ canteenID: req.params.canteenId });
    const zonesWithTables = await Promise.all(
      zones.map(async (z) => {
        const tables = await Table.find({ zoneID: z._id });
        return { ...z.toObject(), tables };
      })
    );

    res.json({
      canteenID: canteen._id,
      name: canteen.name,
      location: canteen.location,
      createdAt: canteen.createdAt,
      updatedAt: canteen.updatedAt,
      zones: zonesWithTables
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;