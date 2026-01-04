import express from "express";
import Shortcut from "../models/Shortcut.js";
import User from "../models/User.js";

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

    let destination = link.fullUrl?.trim();
    if (!destination) {
      return res.json({ success: false, message: "Invalid destination" });
    }

    if (!destination.startsWith("http")) {
      destination = "https://" + destination;
    }

    // ================= DUPLICATE PROTECTION =================
    if (!link.clickedFPs) link.clickedFPs = [];

    if (fingerprint && link.clickedFPs.includes(fingerprint)) {
      console.log("♻️ DUPLICATE USER – NO COUNT");

      return res.json({
        success: true,
        duplicate: true,
        redirect: destination
      });
    }

    // ================= NEW CLICK =================
    link.clicks = Number(link.clicks || 0) + 1;

    if (fingerprint) {
      link.clickedFPs.push(fingerprint);
    }

    // ================= DAILY CLICKS =================
    const today = new Date().toISOString().split("T")[0];
    if (!link.dailyClicks) link.dailyClicks = new Map();
    link.dailyClicks.set(today, (link.dailyClicks.get(today) || 0) + 1);

    // ================= EARNINGS =================
    const CPM = 10;
    const earn = CPM / 1000;

    const user = await User.findOne({ email: link.ownerEmail });
    if (user) {
      user.wallet += earn;
      user.totalEarnings += earn;
      await user.save();
    }

    await link.save();

    console.log("✅ NEW HIT:", destination);

    return res.json({
      success: true,
      duplicate: false,
      redirect: destination
    });

  } catch (err) {
    console.error("❌ FINAL TRACK ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
