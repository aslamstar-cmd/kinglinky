import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

// Routes Imports (Based on your folder structure)
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUsers from "./routes/adminUsers.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import linksRoutes from "./routes/linksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import stepRoutes from "./routes/stepRoutes.js";
import walletRoutes from "./routes/walletRoutes.js"; // Wallet route added

// Models
import admin from "./models/admin.js";
import Shortcut from "./models/Shortcut.js";
import User from "./models/User.js";

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
// 'public' folder-la thaan step pages and ad-check.js irukku
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- 3. API ROUTES MOUNTING ---------------- */
// Admin & Auth Routes
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsers);
app.use("/api/admin/settings", settingsRoutes);

// App Logic Routes
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/steps", stepRoutes);

/* ---------------- 4. USER AUTH LOGIC (LOGIN/SIGNUP) ---------------- */
// Ippo frontend-la irundhu /api/login nu request vandha idhu handle pannum
app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

        const oldUser = await User.findOne({ email });
        if (oldUser) return res.status(400).json({ message: "User exists" });

        const hashedPass = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPass, wallet: 0 });
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

/* ---------------- 5. DATA API ---------------- */
app.get("/api/wallet-balance/:email", async (req, res) => {
    const user = await User.findOne({ email: req.params.email });
    res.json({ balance: user?.wallet || 0 });
});

app.get("/api/user-links/:email", async (req, res) => {
    const links = await Shortcut.find({ ownerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(links);
});

/* ---------------- 6. STEP PAGES ROUTING ---------------- */
app.get("/step1/:code", (req, res) => res.sendFile(path.join(__dirname, "public/step1.html")));
app.get("/step2/:code", (req, res) => res.sendFile(path.join(__dirname, "public/step2.html")));
app.get("/step3/:code", (req, res) => res.sendFile(path.join(__dirname, "public/step3.html")));
app.get("/step4/:code", (req, res) => res.sendFile(path.join(__dirname, "public/step4.html")));
app.get("/final/:code", (req, res) => res.sendFile(path.join(__dirname, "public/final.html")));

/* ---------------- 7. DB CONNECTION & SERVER START ---------------- */
mongoose.set('strictQuery', false);
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo Connected ✅"))
    .catch((err) => console.log("DB Connection Error:", err));

app.get("/", (_req, res) => res.send("KingLinky Server Active 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));