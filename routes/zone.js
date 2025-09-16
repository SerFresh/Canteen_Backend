import express from "express";
import Canteen from "../models/Canteen.js";
import Zone from "../models/Zone.js";
const router = express.Router();

// ✅ POST - เพิ่ม Zone
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

// ✅ PUT - แก้ไข Zone
router.put("/:canteenId/zones/:zoneId", async (req, res) => {
  try {
    const { name } = req.body;
    const { zoneId } = req.params;

    const updatedZone = await Zone.findByIdAndUpdate(
      zoneId,
      { name },
      { new: true }
    );
    if (!updatedZone) return res.status(404).json({ message: "Zone not found" });

    res.json({ message: "Zone updated successfully", zone: updatedZone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET - โรงอาหาร + zones ที่เกี่ยวข้อง
router.get("/:canteenId", async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const zones = await Zone.find({ canteenID: req.params.canteenId });

    res.json({ 
      canteenID: canteen._id,
      name: canteen.name,
      location: canteen.location,
      zones 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
