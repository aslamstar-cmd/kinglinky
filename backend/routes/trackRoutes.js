import express from "express";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/**
 * FINAL STEP LOGIC
 * POST /api/track/final
 */
router.post("/final", async (req, res) => {
  try {
    // Frontend-la irundhu code, fingerprint, duration varum
    const { code, fingerprint, duration } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code is missing" });
    }

    // 1. Database-la link-ah search panrom
    const link = await Shortcut.findOne({ shortCode: code });

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found in database" });
    }

    /* --- OPTIONAL SECURITY CHECKS ---
    Fingerprint check panna nenaicha matum mela irukura fingerprint logic use pannunga.
    Ippo redirection fix panna, basic checks matum pothum.
    */

    // 2. Click count update (duplicate click prevention illama basic-ah panniruken)
    link.clicks = (link.clicks || 0) + 1;
    
    // Inga neenga fingerprint handle panna:
    if (fingerprint && !link.clickedFPs.includes(fingerprint)) {
        link.clickedFPs.push(fingerprint);
    }

    await link.save();

    // 3. Mukkiamana Step: Destination URL confirm panrom
    let destination = link.fullUrl;

    // Link "http" oda start aagala na, athai fix panrom
    if (!destination.startsWith('http')) {
        destination = `https://${destination}`;
    }

    console.log(`✅ Redirecting ${code} to: ${destination}`);

    // 4. Send Success Response
    return res.json({
      success: true,
      redirect: destination
    });

  } catch (err) {
    console.error("❌ FINAL TRACK ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;