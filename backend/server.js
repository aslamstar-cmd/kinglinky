import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

/* ================= MODELS ================= */
import admin from "./models/admin.js";
import Shortcut from "./models/Shortcut.js";
import User from "./models/User.js";
import Withdraw from "./models/withdraw.js";

/* ================= ROUTES ================= */
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUsers from "./routes/adminUsers.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import linksRoutes from "./routes/linksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";

/* ================= CONFIG ================= */
dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: [
    "https://kinglinky.com",
    "https://www.kinglinky.com",
    "https://kinglinky.onrender.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ STATIC FILES */
app.use(express.static(path.join(__dirname, "public")));

/* ================= DB CONNECTION ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("Mongo Error ❌", err));

/* ================= API ROUTES ================= */
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsers);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/track", trackRoutes);

/* =================================================
   STEP 1 → SHORT URL → BLOGGER AD PAGE
================================================= */
app.get("/step1/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) return res.status(404).send("Link not found");

    return res.redirect(
      "https://techalchemistgo.blogspot.com/2026/01/how-online-tools-help-people-save-time_15.html" +
      "?from=short&code=" + encodeURIComponent(code)
    );

  } catch (err) {
    console.error("STEP1 ERROR:", err);
    res.status(500).send("Server error");
  }
});

/* =================================================
   STEP 2 → GET LINK PAGE (STATIC HTML)
================================================= */
app.get("/get/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) return res.status(404).send("Invalid link");

    return res.sendFile(
      path.join(__dirname, "public", "getlink.html")
    );

  } catch (err) {
    console.error("GET PAGE ERROR:", err);
    res.status(500).send("Server error");
  }
});

/* =================================================
   FINAL STEP → REAL URL (COUNT CLICK HERE ONLY)
================================================= */
app.get("/go/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const link = await Shortcut.findOne({ shortCode: code });
    if (!link) return res.status(404).send("Link not found");
    link.clicks = (link.clicks || 0) + 1;
    const today = new Date().toISOString().split("T")[0];
    if (!link.dailyClicks) {
      link.dailyClicks = new Map();
    }
    link.dailyClicks.set(
      today,
      (link.dailyClicks.get(today) || 0) + 1
    );
    await link.save();
    const user = await User.findOne({ email: link.ownerEmail });

    if (user) {
      const perClickEarning = 10 / 1000; // ₹10 CPM
      const earn = perClickEarning;
      user.wallet = (user.wallet || 0) + earn;
      user.totalEarnings = (user.totalEarnings || 0) + earn;
      await user.save();
    }
    return res.redirect(link.fullUrl);
  } catch (err) {
    console.error("FINAL REDIRECT ERROR:", err);
    res.status(500).send("Redirect failed");
  }
});

/* =================================================
   USER PROFILE API
================================================= */
app.get("/api/users/profile", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email missing" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    const links = await Shortcut.find({ ownerEmail: user.email });

    let todayEarnings = 0;
    links.forEach(link => {
      if (link.dailyClicks?.get) {
        const c = link.dailyClicks.get(today) || 0;
        todayEarnings += (c / 1000) * 10;
      }
    });

    return res.json({
      wallet: Number(user.wallet) || 0,
      totalEarnings: Number(user.totalEarnings) || 0,
      todayEarnings: Number(todayEarnings.toFixed(4)),
      name: user.name
    });

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= AUTH ================= */
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      wallet: 0,
      totalEarnings: 0
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "kinglinky_secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= ADMIN CREATE ================= */
app.get("/create-admin", async (_req, res) => {
  const hashed = await bcrypt.hash("aslamlord", 10);
  await admin.findOneAndUpdate(
    { username: "kingaslam" },
    { password: hashed },
    { upsert: true }
  );
  res.send("Admin created / updated ✅");
});

/* ================= HEALTH ================= */
app.get("/", (_req, res) => {
  res.send("KingLinky Server Running 🚀");
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});