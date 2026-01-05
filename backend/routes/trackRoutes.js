import express from "express";
import Shortcut from "../models/Shortcut.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/final", async (req, res) => {
  try {
    const { code, fingerprint } = req.body;

    if (!code) return res.status(400).json({ success: false, message: "Code missing" });

    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) return res.status(404).json({ success: false, message: "Link not found" });

    let destination = link.fullUrl?.trim();
    if (!destination.startsWith("http")) destination = "https://" + destination;

    // ================= DUPLICATE CHECK =================
    if (!link.clickedFPs) link.clickedFPs = [];

    if (fingerprint && link.clickedFPs.includes(fingerprint)) {
      // Viewer munnadiye vanthuttaar. Count yethaama link-ah mattum anuppu.
      return res.json({
        success: true,
        redirect: destination,
        isDuplicate: true 
      });
    }

    // ================= NEW VIEW (REGISTER) =================
    link.clicks = Number(link.clicks || 0) + 1;
    if (fingerprint) link.clickedFPs.push(fingerprint);

    const today = new Date().toISOString().split("T")[0];
    if (!link.dailyClicks) link.dailyClicks = new Map();
    link.dailyClicks.set(today, (link.dailyClicks.get(today) || 0) + 1);

    // Earnings
    const earn = 10 / 1000; // $10 CPM
    const user = await User.findOne({ email: link.ownerEmail });
    if (user) {
      user.wallet = (Number(user.wallet) || 0) + earn;
      user.totalEarnings = (Number(user.totalEarnings) || 0) + earn;
      await user.save();
    }

    await link.save();
    return res.json({ success: true, redirect: destination, isDuplicate: false });

  } catch (err) {
    console.error("TRACK ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;