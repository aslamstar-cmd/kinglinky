import express from "express";
import Withdraw from "../models/withdraw.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

/* ============================
   ADMIN → GET ALL WITHDRAWS
============================ */
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: withdraws,
    });
  } catch (err) {
    console.error("WITHDRAW ADMIN GET ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error", data: [] });
  }
});

/* ============================
   USER → GET OWN WITHDRAWS
============================ */
router.get("/my", userAuth, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: withdraws });
  } catch (err) {
    return res.status(500).json({ success: false, data: [] });
  }
});

/* ============================
   USER → REQUEST WITHDRAW (Wallet koraiyathu)
============================ */
router.post("/", userAuth, async (req, res) => {
  try {
    const { amount, note } = req.body; // Inga amount USD-la varum (Frontend-la irunthu)
    const reqAmount = Number(amount);

    if (!reqAmount || reqAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Daily Limit Check
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingRequest = await Withdraw.findOne({
      userId: req.user.id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You can only send one request per day!"
      });
    }

    // Balance check (Wallet-la irukka nu check mattum thaan panrom, kuraikka maatom)
    const user = await User.findById(req.user.id);
    if (!user || user.wallet < reqAmount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    const withdraw = await Withdraw.create({
      userId: req.user.id,
      userEmail: req.user.email,
      amount: reqAmount,
      note: note || "",
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Withdraw request sent! Wallet will update after admin approval.",
      data: withdraw,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Withdraw failed" });
  }
});

/* ============================
   ADMIN → APPROVE WITHDRAW (Inga thaan Wallet koraiyum)
============================ */
router.post("/approve/:id", adminAuth, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Already paid-ah iruntha thirumba minus panna koodathu
    if (withdraw.status === "paid") {
      return res.status(400).json({ success: false, message: "Already paid!" });
    }

    const user = await User.findById(withdraw.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Final balance check before approval
    if (user.wallet < withdraw.amount) {
       return res.status(400).json({ success: false, message: "User doesn't have enough balance now." });
    }

    // 1. Status-ah 'paid' nu mathu
    withdraw.status = "paid";
    await withdraw.save();

    // 2. Ippo wallet-la irunthu kuraichiru
    user.wallet = Math.max(0, Number(user.wallet) - Number(withdraw.amount));
    await user.save();

    return res.json({
      success: true,
      message: "Payment success! User wallet updated.",
      data: withdraw,
    });
  } catch (err) {
    console.error("WITHDRAW APPROVE ERROR:", err);
    return res.status(500).json({ success: false, message: "Approve failed" });
  }
});

export default router;