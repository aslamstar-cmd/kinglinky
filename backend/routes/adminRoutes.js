import express from "express";
import User from "../models/User.js";
import Shortcut from "../models/Shortcut.js";
import Withdraw from "../models/withdraw.js";

const router = express.Router();

/* =========================
   ADMIN DASHBOARD (MAIN)
   GET /api/admin/dashboard
========================= */
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLinks = await Shortcut.countDocuments();

    const clicksAgg = await Shortcut.aggregate([
      { $group: { _id: null, clicks: { $sum: "$clicks" } } },
    ]);
    const totalClicks = clicksAgg[0]?.clicks || 0;

    const totalEarnings = ((totalClicks / 1000) * 10).toFixed(2); // CPM = 10

    const pendingWithdraws = await Withdraw.countDocuments({
      status: "pending",
    });

    res.json({
      totalUsers,
      totalLinks,
      totalClicks,
      totalEarnings,
      pendingWithdraws,
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).json({
      totalUsers: 0,
      totalLinks: 0,
      totalClicks: 0,
      totalEarnings: "0.00",
      pendingWithdraws: 0,
    });
  }
});

/* =========================
   ADMIN STATS (OPTIONAL)
   GET /api/admin/stats
   (same data – backward compatible)
========================= */
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLinks = await Shortcut.countDocuments();

    const clicksAgg = await Shortcut.aggregate([
      { $group: { _id: null, clicks: { $sum: "$clicks" } } },
    ]);
    const totalClicks = clicksAgg[0]?.clicks || 0;

    const totalEarnings = ((totalClicks / 1000) * 10).toFixed(2);

    const pendingWithdraws = await Withdraw.countDocuments({
      status: "pending",
    });

    res.json({
      totalUsers,
      totalLinks,
      totalClicks,
      totalEarnings,
      pendingWithdraws,
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({});
  }
});

/* =========================
   ADMIN → ALL LINKS
   GET /api/admin/links
========================= */
router.get("/links", async (req, res) => {
  try {
    const links = await Shortcut.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    console.error("ADMIN LINKS ERROR:", err);
    res.status(500).json([]);
  }
});

export default router;