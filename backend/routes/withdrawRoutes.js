import express from "express";
import Withdraw from "../models/withdraw.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

/* ============================
   ADMIN → GET ALL WITHDRAWS
   Endpoint: /api/withdraw/admin
============================ */
router.get("/admin", async (req, res) => {
  try {
    // Note: Temporary-ah adminAuth thookiruken logic work aahuthannu paaka
    const withdraws = await Withdraw.find({}).sort({ createdAt: -1 });
    
    // Direct-ah array-ah anupuna Admin table fetch panna easy-ah irukkum
    return res.json(withdraws); 
  } catch (err) {
    console.error("WITHDRAW ADMIN GET ERROR:", err);
    return res.status(500).json([]);
  }
});

/* ============================
   USER → REQUEST WITHDRAW
============================ */
router.post("/", userAuth, async (req, res) => {
  try {
    const { amount, note, email } = req.body; // email-um backend varum

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const withdraw = await Withdraw.create({
      userId: req.user.id,
      userEmail: email || req.user.email, // Dashboard-la irunthu vara email
      amount: Number(amount),
      note: note || "",
      status: "pending",
    });

    return res.json({ success: true, message: "Withdraw request submitted", data: withdraw });
  } catch (err) {
    console.error("WITHDRAW CREATE ERROR:", err);
    return res.status(500).json({ success: false, message: "Withdraw failed" });
  }
});

// ... (approve route as it is)
export default router;