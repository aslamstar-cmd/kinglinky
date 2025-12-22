import express from "express";
import crypto from "crypto";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/**
 * STEP 1
 * GET /step1/:code
 */
router.get("/step1/:code", async (req, res) => {
  const { code } = req.params;

  const link = await Shortcut.findOne({ shortCode: code });
  if (!link) return res.status(404).send("Invalid link");

  const token = crypto.randomBytes(16).toString("hex");

  // token + code browser ku pass pannrom
  res.send(`
    <script>
      sessionStorage.setItem("step_token", "${token}");
      sessionStorage.setItem("short_code", "${code}");
      sessionStorage.setItem("step", "1");
      location.href = "/step1.html";
    </script>
  `);
});

/**
 * FINAL TRACK
 * POST /api/track/final
 */
router.post("/api/track/final", async (req, res) => {
  const { code } = req.body;

  const link = await Shortcut.findOne({ shortCode: code });
  if (!link) return res.json({ success: false });

  link.clicks += 1;
  await link.save();

  res.json({
    success: true,
    redirect: link.fullUrl,
  });
});

export default router;