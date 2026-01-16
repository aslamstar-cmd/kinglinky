import express from "express";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/**
 * STEP 1 – ENTRY POINT
 * https://www.kinglinky.com/step1/:code
 */
router.get("/step1/:code", async (req, res) => {
  try {
    const { code } = req.params;
    console.log("Searching for code:", code); // Console-la check panna

    const link = await Shortcut.findOne({ shortCode: code });
    
    if (!link) {
      console.log("Link not found in DB!");
      return res.status(404).send("<h1>Invalid Link</h1>");
    }

    console.log("Link found, redirecting to Blogger...");
    return res.redirect(`https://techalchemistgo.blogspot.com/2026/01/how-online-tools-help-people-save-time_15.html?from=short&code=${code}`);

  } catch (err) {
    console.error("Step1 error:", err);
    res.status(500).send("Server error: " + err.message);
  }
});

/**
 * FINAL STEP – AFTER PAGE 4
 * https://www.kinglinky.com/step1/:code/final
 */
router.get("/step1/:code/final", async (req, res) => {
  try {
    const { code } = req.params;

    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) {
      return res.status(404).send("Invalid link");
    }

    // FINAL DESTINATION
    return res.redirect(link.originalUrl);

  } catch (err) {
    console.error("Final step error:", err);
    res.status(500).send("Server error");
  }
});

export default router;