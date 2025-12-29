import express from "express";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/**
 * FINAL REDIRECT
 * POST /api/track/final
 */
router.post("/final", async (req, res) => {
  try {
    const { code, fingerprint } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code missing" });
    }

    const link = await Shortcut.findOne({ shortCode: code });

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    // Duplicate protection
    if (!link.clickedFPs) link.clickedFPs = [];

    if (fingerprint && link.clickedFPs.includes(fingerprint)) {
      return res.json({ success: false, message: "Duplicate click blocked" });
    }

    link.clicks = (link.clicks || 0) + 1;
    if (fingerprint) link.clickedFPs.push(fingerprint);

    await link.save();

    let destination = link.fullUrl?.trim();

    if (!destination) {
      return res.json({ success: false, message: "Invalid destination" });
    }

    if (!destination.startsWith("http://") && !destination.startsWith("https://")) {
      destination = "https://" + destination;
    }

    console.log("✅ FINAL REDIRECT:", destination);

    return res.json({
      success: true,
      redirect: destination
    });

  } catch (err) {
    console.error("FINAL ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;