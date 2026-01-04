import express from "express";
import Withdraw from "../models/withdraw.js";
import User from "../models/User.js"; // USER MODEL KANDIPPA VENUM
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

/* ============================
   ADMIN → GET ALL WITHDRAWS
============================ */
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({}).sort({ createdAt: -1 });
    console.log("Admin Fetching Withdraws count:", withdraws.length);

    return res.status(200).json({
      success: true,
      data: withdraws,
    });
  } catch (err) {
    console.error("WITHDRAW ADMIN GET ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: [],
    });
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

    return res.json({
      success: true,
      data: withdraws,
    });
  } catch (err) {
    console.error("WITHDRAW MY ERROR:", err);
    return res.status(500).json({
      success: false,
      data: [],
    });
  }
});

/* ============================
   USER → REQUEST WITHDRAW
============================ */
router.post("/", userAuth, async (req, res) => {
  try {
    const { amount, note } = req.body;
    const reqAmount = Number(amount);

    if (!reqAmount || reqAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Daily Limit Check: Oru naalukku oru request thaan
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
        message: "Limit Reached: You can only send one request per day!"
      });
    }

    // User kitta balance irukka nu check panrom
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
      message: "Withdraw request submitted",
      data: withdraw,
    });
  } catch (err) {
    console.error("WITHDRAW CREATE ERROR:", err);
    return res.status(500).json({ success: false, message: "Withdraw failed" });
  }
});

/* ============================
   ADMIN → APPROVE WITHDRAW (FIXED)
============================ */
router.post("/approve/:id", adminAuth, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Request ippo thaan 'paid' aaga poguthuna mattum wallet-ah kuraikanum
 if (withdraw.status !== "paid") {
  withdraw.status = "paid";
  await withdraw.save();

  const user = await User.findOne({ email: withdraw.email });
  if (user) {
    user.wallet = Math.max(
      0,
      Number(user.wallet || 0) - Number(withdraw.amount || 0)
    );
    await user.save();
  }
}

    withdraw.status = "paid";
    const updated = await withdraw.save();

    return res.json({
      success: true,
      message: "Withdraw approved and wallet updated",
      data: updated,
    });
  } catch (err) {
    console.error("WITHDRAW APPROVE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Approve failed",
    });
  }
});

export default router;