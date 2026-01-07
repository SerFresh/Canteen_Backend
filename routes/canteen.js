const express = require("express");
const Canteen = require("../models/Canteen");
const Zone = require("../models/Zone");
const Table = require("../models/Table");

const router = express.Router();

/* ---------- CANTEEN ---------- */
router.post("/", async (req, res) => {
  try {
    const { name, location } = req.body;
    const canteen = await Canteen.create({ name, location });
    res.status(201).json({ message: "Canteen created", canteen });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/", async (req, res) => {
  try {
    const canteens = await Canteen.find();

    const result = await Promise.all(
      canteens.map(async (canteen) => {
        // หาทุก zone ใน canteen
        const zones = await Zone.find({ canteenID: canteen._id }).select("_id");
        const zoneIDs = zones.map(z => z._id);

        // นับโต๊ะทั้งหมดใน zone
        const totalTables = await Table.countDocuments({ zoneID: { $in: zoneIDs } });

        // นับโต๊ะที่ Unavailable หรือ Reserved
        const blockedTables = await Table.countDocuments({
          zoneID: { $in: zoneIDs },
          status: { $in: ["Unavailable", "Reserved"] }
        });

        return {
          ...canteen.toObject(),
          totalTables,
          blockedTables
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:canteenId", async (req, res) => {
  try {
    const updated = await Canteen.findByIdAndUpdate(req.params.canteenId, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Canteen not found" });
    res.json({ message: "Canteen updated", canteen: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------- ZONE ---------- */
router.post("/:canteenId/zones", async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });
    const zone = await Zone.create({ ...req.body, canteenID: req.params.canteenId });
    res.status(201).json({ message: "Zone created", zone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:canteenId/zones/:zoneId", async (req, res) => {
  try {
    const updated = await Zone.findByIdAndUpdate(req.params.zoneId, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Zone not found" });
    res.json({ message: "Zone updated", zone: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------- TABLE ---------- */
router.post("/:canteenId/zones/:zoneId/tables", async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.zoneId);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    const table = await Table.create({ ...req.body, zoneID: req.params.zoneId });
    res.status(201).json({ message: "Table created", table });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:canteenId/zones/:zoneId/tables/:tableId", async (req, res) => {
  try {
    const updated = await Table.findByIdAndUpdate(req.params.tableId, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Table not found" });
    res.json({ message: "Table updated", table: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ---------- GET CANTEEN FULL ---------- */
router.get("/:canteenId", async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.canteenId);
    if (!canteen) return res.status(404).json({ message: "Canteen not found" });

    const zones = await Zone.find({ canteenID: canteen._id });
    const zonesWithTables = await Promise.all(zones.map(async z => {
      const tables = await Table.find({ zoneID: z._id });
      return { ...z.toObject(), tables };
    }));

    res.json({ ...canteen.toObject(), zones: zonesWithTables });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// router.get("/:canteenId", async (req, res) => {
//   try {
//     const canteen = await Canteen.findById(req.params.canteenId);
//     if (!canteen)
//       return res.status(404).json({ message: "Canteen not found" });

//     // 🔹 Zones + Tables
//     const zones = await Zone.find({ canteenID: canteen._id });
//     const zonesWithTables = await Promise.all(
//       zones.map(async (z) => {
//         const tables = await Table.find({ zoneID: z._id });
//         return { ...z.toObject(), tables };
//       })
//     );

//     // 🔹 Inns + InnName
//     const inns = await Inn.find({ canteenID: canteen._id });
//     const innsWithName = await Promise.all(
//       inns.map(async (inn) => {
//         const innNames = await InnName.find({ innID: inn._id });
//         return {
//           ...inn.toObject(),
//           names: innNames, // ชื่อร้าน
//         };
//       })
//     );

//     res.json({
//       ...canteen.toObject(),
//       zones: zonesWithTables,
//       inns: innsWithName,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;
