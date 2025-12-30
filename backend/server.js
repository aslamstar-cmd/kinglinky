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
import Withdraw from "./models/withdraw.js"; 

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

/* ---------------- 1. CORS & JSON ---------------- */
app.use(cors({
    origin: ["https://www.kinglinky.com", "https://kinglinky.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- 2. DB CONNECTION ---------------- */
// MongoDB connection string-ah check panni connect pannuvom
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("Database Connected Successfully ✅"))
    .catch((err) => console.log("DB Connection Error ❌:", err));

/* ---------------- 3. ROUTES MOUNTING ---------------- */
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsers);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/track", trackRoutes); 
app.use(stepRoutes);

/* ---------------- 4. CRITICAL DASHBOARD FIX ---------------- */

app.get("/api/users/profile", async (req, res) => {
    try {
        const { email } = req.query;
        console.log("Fetching profile for:", email); // Log check panna

        if (!email) return res.status(400).json({ message: "Email missing" });

        // Database la user-ah thedurom
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            console.log("User not found in DB for email:", email);
            return res.status(404).json({ message: "User not found" });
        }

        // Today Earnings Calculation
        const today = new Date().toISOString().split('T')[0];
        const userLinks = await Shortcut.find({ ownerEmail: user.email });
        
        let todayEarned = 0;
        userLinks.forEach(link => {
            if (link.dailyClicks && typeof link.dailyClicks.get === 'function') {
                const clicksToday = link.dailyClicks.get(today) || 0;
                todayEarned += (clicksToday / 1000) * 10;
            }
        });

        console.log(`Data found: Wallet: ${user.wallet}, Earnings: ${user.totalEarnings}`);

        res.json({
            success: true,
            wallet: Number(user.wallet) || 0,
            totalEarnings: Number(user.totalEarnings) || 0,
            todayEarnings: Number(todayEarned.toFixed(4)),
            name: user.name
        });
    } catch (err) {
        console.error("Profile API Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.get("/api/withdraw/my", async (req, res) => {
    try {
        const { email } = req.query;
        const withdraws = await Withdraw.find({ userEmail: email }).sort({ createdAt: -1 });
        
        // Paid withdraw-ah mattum kooti total withdraw money calculation
        const totalWithdrawn = withdraws
            .filter(w => w.status === 'paid')
            .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

        res.json({ 
            success: true, 
            data: withdraws,
            totalWithdrawn: totalWithdrawn 
        });
    } catch (err) {
        res.json({ success: false, data: [] });
    }
});

/* ---------------- 5. REMAINING APIS ---------------- */

app.get("/api/wallet/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.json({ balance: user?.wallet || 0 });
    } catch (e) { res.status(500).json({ balance: 0 }); }
});

app.get("/api/user-links/:email", async (req, res) => {
    try {
        const links = await Shortcut.find({ ownerEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(links);
    } catch (e) { res.status(500).json([]); }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "kinglinky_secret", { expiresIn: "7d" });
        res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (err) { res.status(500).json({ message: "Login failed" }); }
});

app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const oldUser = await User.findOne({ email: email.toLowerCase() });
        if (oldUser) return res.status(400).json({ message: "User exists" });
        const hashedPass = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email: email.toLowerCase(), password: hashedPass, wallet: 0, totalEarnings: 0 });
        await newUser.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "Signup failed" }); }
});

app.get("/create-admin", async (req, res) => {
    const hashed = await bcrypt.hash("aslamlord", 10);
    await admin.findOneAndUpdate({ username: "kingaslam" }, { password: hashed }, { upsert: true });
    res.send("Admin OK");
});

app.get("/", (req, res) => res.send("KingLinky Server Active 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));