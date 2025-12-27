import express from "express";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/* FETCH LINKS */
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    let filter = {};
    if (email) {
      filter = { ownerEmail: email };
    }
    const links = await Shortcut.find(filter).sort({ createdAt: -1 });
    res.json(links);
  } catch (err) {
    console.error("LINKS FETCH ERROR", err);
    res.status(500).json([]);
  }
});

/* SHORTEN LINK */
router.post("/shorten", async (req, res) => {
  try {
    const { longUrl, email } = req.body;
    if (!longUrl || !email) {
      return res.status(400).json({ message: "URL or email missing" });
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

    res.status(201).json({ success: true, shortUrl: link.shortUrl });
  } catch (err) {
    console.error("SHORTEN ERROR", err);
    res.status(500).json({ message: "Shorten failed" });
  }
});

/* DELETE LINK (Intha section missing-ah irunthathu, ippo add panniyachu) */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLink = await Shortcut.findByIdAndDelete(id);
    
    if (!deletedLink) {
      return res.status(404).json({ message: "Link not found" });
    }
    
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR", err);
    res.status(500).json({ message: "Delete failed on server" });
  }
});

export default router;