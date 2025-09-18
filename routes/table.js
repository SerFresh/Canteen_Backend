const express = require("express");
const router = express.Router();
const Table = require("../models/Table");

// PATCH /api/tables/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { occupied } = req.body; // true = มีคน, false = ไม่มีคน

    if (typeof occupied !== "boolean") {
      return res.status(400).json({ message: "occupied (boolean) is required" });
    }

    const newStatus = occupied ? "Unavailable" : "Available";

    const updated = await Table.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Table not found" });

    res.json({
      message: `Table status updated to ${newStatus}`,
      table: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:tableId/unblock", isAuthenticated, async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: "Table not found" });

    // เปลี่ยนโต๊ะกลับเป็น Available เฉพาะกรณีที่โต๊ะถูกบล็อก
    if (table.status === "Unavailable") {
      table.status = "Available";
      await table.save();
      return res.json({ message: "Table is now available", table });
    }

    // ถ้าโต๊ะไม่ใช่ Unavailable → ไม่มีอะไรต้องทำ
    res.status(400).json({ message: "Table is not blocked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
