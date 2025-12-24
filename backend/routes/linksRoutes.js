import express from "express";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/* =========================
   USER LINKS (EMAIL BASED)
   GET /api/links/:email
========================= */
router.get("/:email", async (req, res) => {
  try {
    const links = await Shortcut.find({
      ownerEmail: req.params.email,
    }).sort({ createdAt: -1 });

    res.json(links);
  } catch (err) {
    console.error("LINKS FETCH ERROR", err);
    res.status(500).json([]);
  }
});

/* =========================
   ADMIN ALL LINKS
   GET /api/links
========================= */
router.get("/", async (req, res) => {
  try {
    const links = await Shortcut.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* =========================
   SHORTEN LINK
   POST /api/links/shorten
========================= */
router.post("/links/shorten", async (req, res) => {
  try {
    const { longUrl, email } = req.body;

    if (!longUrl || !email) {
      return res.status(400).json({
        message: "URL or email missing",
      });
    }

    const code = Math.random().toString(36).substring(2, 8);
    const shortUrl = `${process.env.BASE_URL}/step1.html?code=${code}`;

    const link = await Shortcut.create({
      fullUrl: longUrl,
      shortCode: code,
      shortUrl,
      ownerEmail: email,
      clicks: 0,
      clickedIPs: [],
    });

    res.status(201).json({
      success: true,
      shortUrl: link.shortUrl, link,
    });
  } catch (err) {
    console.error("SHORTEN ERROR", err);
    res.status(500).json({ message: "Shorten failed" });
  }
});

export default router;