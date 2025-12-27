import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import requestIp from "request-ip";
import admin from "./models/admin.js";

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
import userAuth from "./middleware/userAuth.js";


dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();
app.use(cors({ origin:[
  "https://www.kinglinky.com",
  "https://kinglinky.com",
  "https://api.kinglinky.com"
],
methods: ["GET", "POST", "PUT", "DELETE"],
allowedHeaders: ["Content-type", "Authorization"],
credentials: true
 }));
/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended:true}));
app.use(express.static(path.join(__dirname, "public")));


/* ---------------- ROUTES ---------------- */
app.use(express.json());
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsers);
app.use("/api/admin/settings",settingsRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/track", trackRoutes);
app.use(express.static("public")); // 👈 VERY IMPORTANT
app.use(stepRoutes);

/* ---------------- DB ---------------- */
mongoose
  .connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`)
  .then(() => console.log("Mongo Connected ✅"))
  .catch((err) => console.log(err));

/* ---------------- BASIC ---------------- */
app.get("/create-admin", async(req, res)=>{
  try{
  const hashed = await bcrypt.hash("aslamlord", 10);
  await admin.create({
    username:"kingaslam",
    password:hashed,
  });
  res.send("admin created");
}catch (err){
 console.log("Created Admin Error", err );
 res.status(500).send(err.message);
}});

app.get("/", (_req, res) => res.send("Server running 🚀"));

/* ---------------- SHORTEN ---------------- */
// app.post("/api/links/shorten",userAuth, async (req, res) => {
//   try {
//     const { longUrl  } = req.body;

//     if (!longUrl) {
//       return res.status(400).json({ message: "URL missing" });
//     }

//     const shortCode = Math.random().toString(36).substring(2, 8);

//     const shortUrl =
//       `${process.env.BASE_URL}/step1.html?code=${shortCode}`;

//     const link = await Shortcut.create({
//       fullUrl: longUrl,
//       shortCode,
//       shortUrl,
//       ownerEmail: req.user.email,
//       clicks: 0,
//       clickedIPs: [],
//     });

//     return res.status(201).json({
//       success: true,
//       shortUrl: link.shortUrl, // ✅ ONLY THIS
//     });

//   } catch (err) {
//     console.error("SHORTEN ERROR:", err);
//     res.status(500).json({ message: "Shorten failed" });
//   }
// });

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
import jwt from "jsonwebtoken";

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔥 TOKEN CREATE
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "kinglinky_secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token, // 🔥 THIS WAS MISSING
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
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