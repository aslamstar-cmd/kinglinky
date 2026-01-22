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
   USER → REQUEST WITHDRAW 
   (Note: Wallet deduction doesn't happen here)
============================ */
router.post("/", userAuth, async (req, res) => {
  try {
    const { amount, note } = req.body; 
    const reqAmount = Number(amount);

    if (!reqAmount || reqAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Daily Limit Check: One request per day
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

    // Check balance (verify only, don't deduct yet)
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
      message: "Withdraw request sent! Amount will be deducted after admin approval.",
      data: withdraw,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Withdraw failed" });
  }
});

/* ============================
   ADMIN → APPROVE WITHDRAW 
   (Logic: Deduct from Wallet & Add to Total Withdrawn)
============================ */
router.post("/approve/:id", adminAuth, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Check if already processed
    if (withdraw.status === "paid") {
      return res.status(400).json({ success: false, message: "Already marked as paid!" });
    }

    const user = await User.findById(withdraw.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Safety balance check
    if (user.wallet < withdraw.amount) {
       return res.status(400).json({ success: false, message: "User has insufficient balance now." });
    }

    // 1. Update Withdraw Status
    withdraw.status = "paid";
    await withdraw.save();

    // 2. Wallet Logic: Minus the specific withdrawal amount only
    user.wallet = Math.max(0, Number(user.wallet) - Number(withdraw.amount));

    // 3. Tracking Logic: Add to user's total withdrawn history
    user.totalWithdrawn = Number(user.totalWithdrawn || 0) + Number(withdraw.amount);

    await user.save();

    return res.json({
      success: true,
      message: "Payment approved! Wallet balance updated and tracked.",
      data: withdraw,
    });
  } catch (err) {
    console.error("WITHDRAW APPROVE ERROR:", err);
    return res.status(500).json({ success: false, message: "Approve failed" });
  }
});

export default router;