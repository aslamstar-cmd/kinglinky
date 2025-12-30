import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// Models
import admin from "./models/admin.js";
import Shortcut from "./models/Shortcut.js";
import User from "./models/User.js";
import Withdraw from "./models/withdraw.js"; // IMPORT WITHDRAW MODEL

// Routes
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUsers from "./routes/adminUsers.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import linksRoutes from "./routes/linksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import stepRoutes from "./routes/stepRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();

/* ---------------- 1. CORS FIX ---------------- */
app.use(cors({
    origin: [
        "https://www.kinglinky.com",
        "https://kinglinky.com",
        "https://api.kinglinky.com",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

/* ---------------- 2. MIDDLEWARES ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- 3. ROUTES MOUNTING ---------------- */
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsers);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/track", trackRoutes); 
app.use(stepRoutes);

/* ---------------- 4. DB CONNECTION ---------------- */
mongoose
    .connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB || ''}`)
    .then(() => console.log("Mongo Connected ✅"))
    .catch((err) => console.log("DB Connection Error:", err));

/* ---------------- 5. DASHBOARD FIX APIS ---------------- */

// PROFILE API: Dashboard-la Wallet and Total Earnings vara
app.get("/api/users/profile", async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            success: true,
            name: user.name,
            email: user.email,
            wallet: Number(user.wallet) || 0,
            totalEarnings: Number(user.totalEarnings) || 0
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// WITHDRAW MY API: "Withdrawn" money dashboard-la update aaga
// Frontend `axios.get(${API_BASE}/api/withdraw/my?email=${user.email})` nu kekkum
app.get("/api/withdraw/my", async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ success: false, data: [] });

        const withdraws = await Withdraw.find({ userEmail: email }).sort({ createdAt: -1 });
        res.json({ success: true, data: withdraws });
    } catch (err) {
        res.status(500).json({ success: false, data: [] });
    }
});

/* ---------------- 6. AUTH LOGIC ---------------- */
app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

        const oldUser = await User.findOne({ email });
        if (oldUser) return res.status(400).json({ message: "User exists" });

        const hashedPass = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPass, wallet: 0, totalEarnings: 0 });
        await newUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "Signup failed" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "kinglinky_secret",
            { expiresIn: "7d" }
        );

        res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
});

/* ---------------- 7. OTHER DATA APIS ---------------- */
app.get("/api/wallet/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.json({ balance: user?.wallet || 0 });
    } catch (e) {
        res.status(500).json({ balance: 0 });
    }
});

app.get("/api/user-links/:email", async (req, res) => {
    try {
        const links = await Shortcut.find({ ownerEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(links);
    } catch (e) {
        res.status(500).json([]);
    }
});

// Admin creation tool
app.get("/create-admin", async (req, res) => {
    const hashed = await bcrypt.hash("aslamlord", 10);
    await admin.findOneAndUpdate({ username: "kingaslam" }, { password: hashed }, { upsert: true });
    res.send("Admin OK");
});

app.get("/", (_req, res) => res.send("KingLinky Server Active 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server started on ${PORT}`));