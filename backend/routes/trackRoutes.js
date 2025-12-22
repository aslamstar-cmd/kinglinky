import express from "express";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/**
 * FINAL STEP ONLY
 * POST /api/track/final
 */
router.post("/final", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.json({ success: false });
    }

    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) {
      return res.json({ success: false });
    }

    // ✅ FINAL SUCCESS → COUNT ONLY HERE
    link.clicks += 1;
    await link.save();

    res.json({
      success: true,
      redirect: link.fullUrl,
    });
  } catch (err) {
    console.error("FINAL TRACK ERROR:", err);
    res.json({ success: false });
  }
});
router.post("/final", async (req, res) => {
  const { code, fingerprint, duration } = req.body;

  if (!fingerprint) {
    return res.json({ success: false, message: "FP missing" });
  }

  if (duration < 25) {
    return res.json({ success: false, message: "Too fast" });
  }

  const link = await Shortcut.findOne({ shortCode: code });
  if (!link) {
    return res.json({ success: false });
  }

  // 🚫 Fingerprint duplicate block
  if (link.clickedFPs.includes(fingerprint)) {
    return res.json({
      success: false,
      message: "Duplicate device"
    });
  }

  // ✅ valid click
  link.clickedFPs.push(fingerprint);
  link.clicks += 1;
  await link.save();

  res.json({
    success: true,
    redirect: link.fullUrl
  });
});

export default router;