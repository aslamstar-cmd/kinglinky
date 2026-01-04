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
      return res.status(400).json({
        success: false,
        message: "Code missing"
      });
    }

    // 🔍 Find short link
    const link = await Shortcut.findOne({ shortCode: code });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Link not found"
      });
    }

    // Prepare Destination URL beforehand
    let destination = link.fullUrl?.trim();
    if (destination && !destination.startsWith("http://") && !destination.startsWith("https://")) {
      destination = "https://" + destination;
    }

    /* ============================================================
       DUPLICATE CLICK PROTECTION (FIXED)
       ============================================================ */
    if (!link.clickedFPs) link.clickedFPs = [];

    if (fingerprint && link.clickedFPs.includes(fingerprint)) {
      // User thirumba varaanga, so count ethuvum pannaama 
      // direct-ah redirect URL mattum anuppiduvom.
      console.log("♻️ DUPLICATE USER - BYPASSING COUNT");
      return res.json({
        success: false, // Success false-na dashboard-la count yeraathu
        message: "Duplicate click - Redirecting anyway",
        redirect: destination // <--- Ithuthaan logic! User-ku link poyidum
      });
    }

    /* ============================================================
       1️⃣ TOTAL CLICKS UPDATE (Only for New Users)
       ============================================================ */
    link.clicks = (link.clicks || 0) + 1;

    if (fingerprint) {
      link.clickedFPs.push(fingerprint);
    }

    /* =========================
       2️⃣ DAILY CLICKS UPDATE
       ========================= */
    const today = new Date().toISOString().split("T")[0];
    if (!link.dailyClicks) {
      link.dailyClicks = new Map();
    }
    link.dailyClicks.set(
      today,
      (link.dailyClicks.get(today) || 0) + 1
    );

    /* =========================
       3️⃣ EARNINGS (CPM LOGIC)
       ========================= */
    const CPM = 10; 
    const earn = CPM / 1000;

    /* =========================
       4️⃣ USER WALLET UPDATE
       ========================= */
    const user = await User.findOne({ email: link.ownerEmail });
    if (user) {
      user.wallet = Number(user.wallet || 0) + earn;
      user.totalEarnings = Number(user.totalEarnings || 0) + earn;
      await user.save();
    }

    /* =========================
       SAVE LINK
       ========================= */
    await link.save();

    if (!destination) {
      return res.json({
        success: false,
        message: "Invalid destination"
      });
    }

    console.log("✅ NEW HIT - REDIRECTING:", destination);

    return res.json({
      success: true,
      redirect: destination
    });

  } catch (err) {
    console.error("❌ FINAL TRACK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;