import express from "express";
import Withdraw from "../models/withdraw.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

/* ============================
   ADMIN → GET ALL WITHDRAWS
   GET /api/withdraw/admin
============================ */
router.get("/admin", adminAuth, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({})
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: withdraws,
    });
  } catch (err) {
    console.error("WITHDRAW ADMIN GET ERROR:", err);
    return res.status(500).json({
      success: false,
      data: [],
    });
  }
});

/* ============================
   USER → GET OWN WITHDRAWS
   GET /api/withdraw/my
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
   POST /api/withdraw
============================ */
router.post("/", userAuth, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const withdraw = await Withdraw.create({
      userId: req.user.id,
      userEmail: req.user.email,
      amount: Number(amount),
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
    return res.status(500).json({
      success: false,
      message: "Withdraw failed",
    });
  }
});

/* ============================
   ADMIN → APPROVE WITHDRAW
   POST /api/withdraw/approve/:id
============================ */
router.post("/approve/:id", adminAuth, async (req, res) => {
  try {
    const updated = await Withdraw.findByIdAndUpdate(
      req.params.id,
      { status: "paid" },
      { new: true }
    );

    return res.json({
      success: true,
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