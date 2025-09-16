import express from "express";
import Canteen from "../models/Canteen.js";
import Zone from "../models/Zone.js";
import Table from "../models/Table.js";
const router = express.Router();

// ✅ POST - เพิ่ม Table
router.post("/:canteenId/zones/:zoneId/tables", async (req, res) => {
  try {
    const { number, arduinoSensor, status, qr_code_token } = req.body;
    const { zoneId } = req.params;

    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    const newTable = new Table({
      number,
      arduinoSensor,
      status,
      qr_code_token,
      zoneID: zoneId
    });
    await newTable.save();

    res.status(201).json({ message: "Table created successfully", table: newTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT - แก้ไข Table
router.put("/:canteenId/zones/:zoneId/tables/:tableId", async (req, res) => {
  try {
    const { number, arduinoSensor, status } = req.body;
    const { tableId } = req.params;

    const updatedTable = await Table.findByIdAndUpdate(
      tableId,
      { number, arduinoSensor, status },
      { new: true }
    );
    if (!updatedTable) return res.status(404).json({ message: "Table not found" });

    res.json({ message: "Table updated successfully", table: updatedTable });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET - Canteen + Zones + Tables
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
      zones: zonesWithTables
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
