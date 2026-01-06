import express from "express";
import crypto from "crypto";
import Shortcut from "../models/Shortcut.js";

const router = express.Router();

/**
 * STEP 1 REDIRECTOR
 * GET /step1/:code
 */
router.get("/step1/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Check if the code exists in DB
    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) {
      return res.status(404).send("<h1>Invalid Link!</h1><p>The link you are looking for does not exist.</p>");
    }

    // 2. Security Token generation
    const token = crypto.randomBytes(16).toString("hex");

    // 3. FIXED REDIRECT:
    // Browser-ah force panni step1.html-ku anuppuvom with the code in URL.
    // Intha script direct-ah public folder-la irukka static HTML-ku kootitu pohum.
    res.send(`
      <html>
        <body style="background:#f3f4f6; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
          <div style="text-align:center;">
            <h2>Verifying Link...</h2>
            <p>Please wait while we redirect you safely.</p>
          </div>
          <script>
            // Store security data
            sessionStorage.setItem("step_token", "${token}");
            sessionStorage.setItem("short_code", "${code}");
            sessionStorage.setItem("step", "1");
            
            // Direct redirect to static HTML file
            // URL params sethu anuppuna thaan next steps-la code kidaikkum
            window.location.href = "/step1.html?code=${code}";
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Step 1 Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

export default router;