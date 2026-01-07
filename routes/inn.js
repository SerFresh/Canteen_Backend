const express = require("express");
const router = express.Router();
const Canteen = require("../models/Canteen");
const Inn = require("../models/Inn");
const InnName = require("../models/InnName");
const Menu = require("../models/Menu");

router.post("/:canteenId/inns", async (req, res) => {
  try {
    const { canteenId } = req.params;

    const canteen = await Canteen.findById(canteenId);
    if (!canteen)
      return res.status(404).json({ message: "Canteen not found" });

    const inn = await Inn.create({
      ...req.body,
      canteenID: canteenId,
    });

    res.status(201).json({
      message: "Inn created",
      inn,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/inns/:innId/names", async (req, res) => {
  try {
    const { innId } = req.params;

    const inn = await Inn.findById(innId);
    if (!inn)
      return res.status(404).json({ message: "Inn not found" });

    const innName = await InnName.create({
      ...req.body,
      innID: innId,
    });

    res.status(201).json({
      message: "Inn name created",
      innName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/inn-names/:innNameId/menus", async (req, res) => {
  try {
    const { innNameId } = req.params;

    const innName = await InnName.findById(innNameId);
    if (!innName)
      return res.status(404).json({ message: "InnName not found" });

    let createdMenus;

    if (Array.isArray(req.body.menus)) {
      const menusToInsert = req.body.menus.map(m => ({
        ...m,
        innNameID: innNameId,
      }));
      createdMenus = await Menu.insertMany(menusToInsert);
    } else {
      createdMenus = await Menu.create({
        ...req.body,
        innNameID: innNameId,
      });
    }

    res.status(201).json({
      message: "Menu(s) created",
      menus: createdMenus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
