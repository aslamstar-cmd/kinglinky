import express from "express";
import Settings from "../models/settings.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/**
 * GET SETTINGS
 * /api/admin/settings
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error("GET SETTINGS ERROR", err);
    res.status(500).json({});
  }
});

/**
 * UPDATE SETTINGS
 * /api/admin/settings
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const { siteName, cpm, minWithdraw, currency } = req.body;

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    settings.siteName = siteName;
    settings.cpm = cpm;
    settings.minWithdraw = minWithdraw;
    settings.currency = currency;

    await settings.save();

    res.json({ success: true, settings });
  } catch (err) {
    console.error("UPDATE SETTINGS ERROR", err);
    res.status(500).json({ success: false });
  }
});

export default router;