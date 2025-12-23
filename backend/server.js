import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import requestIp from "request-ip";

import Shortcut from "./models/Shortcut.js";
import User from "./models/User.js";

import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUsers from "./routes/adminUsers.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import linksRoutes from "./routes/linksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import stepRoutes from "./routes/stepRoutes.js";


dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();
app.use(cors({ origin: ["https://kinglinky-aslams-projects-4088e534.vercel.app"],   
methods: ["GET", "POST", "PUT", "DELETE"],
credentials: true
 }));

 app.options("*", cors());
/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


/* ---------------- ROUTES ---------------- */
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsers);
app.use("/api/admin/settings",settingsRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/track", trackRoutes);
app.use(express.json());
app.use(express.static("public")); // 👈 VERY IMPORTANT
app.use(stepRoutes);

/* ---------------- DB ---------------- */
mongoose
  .connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`)
  .then(() => console.log("Mongo Connected ✅"))
  .catch((err) => console.log(err));

/* ---------------- BASIC ---------------- */
app.get("/", (_req, res) => res.send("Server running 🚀"));

/* ---------------- SHORTEN ---------------- */
app.post("/api/links/shorten", async (req, res) => {
  try {
    const { longUrl, email } = req.body;
    if (!longUrl || !email)
      return res.status(400).json({ message: "URL or email missing" });

    const shortCode = Math.random().toString(36).substring(2, 8);
    const BASE_URL = process.env.BASE_URL;

    const shortUrl = `${BASE_URL}/step1/${shortCode}`;

    const link = await Shortcut.create({
      fullUrl: longUrl,
      shortCode,
      shortUrl,
      ownerEmail: email,
      clicks: 0,
      clickedIPs: [],
    });

    res.json({ success: true, shortUrl, link });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Shorten failed" });
  }
});

/* ---------------- STEPS ---------------- */

app.use(express.static("public"));

app.get("/step1/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public/step1.html"));
});

app.get("/step2/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public/step2.html"));
});

app.get("/step3/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public/step4.html"));
});
app.get("/step4/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public/step4.html"));
});

/* ---------------- AUTH ---------------- */
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const oldUser = await User.findOne({ email });
    if (oldUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPass,
      wallet: 0,
      referralEarnings: 0,
    });

    await newUser.save();

    res.json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ success: false });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ---------------- WALLET ---------------- */
app.get("/api/wallet/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  res.json({ balance: user?.wallet || 0 });
});

/* ---------------- USER LINKS ---------------- */
app.get("/api/links/:email", async (req, res) => {
  const links = await Shortcut.find({
    ownerEmail: req.params.email,
  }).sort({ createdAt: -1 });

  res.json(links);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server started on", PORT));