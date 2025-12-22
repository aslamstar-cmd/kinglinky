import express from "express";
import User from "../models/User.js";
import Shortcut from "../models/Shortcut.js";
import Withdraw from "../models/withdraw.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    const result = await Promise.all(
      users.map(async (u) => {
        const links = await Shortcut.find({ ownerEmail: u.email });
        const clicks = links.reduce((a, b) => a + (b.clicks || 0), 0);

        const earnings = (clicks / 1000) * 10;

        const paid = await Withdraw.find({
          userEmail: u.email,
          status: "paid",
        });

        const paidAmt = paid.reduce((a, b) => a + (b.amount || 0), 0);

        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          wallet: Math.max(earnings - paidAmt, 0),
          referralEarnings: u.referralEarnings || 0,
          totalEarnings: earnings,
          createdAt: u.createdAt,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("ADMIN USERS ERROR", err);
    res.status(500).json([]);
  }
});

export default router;