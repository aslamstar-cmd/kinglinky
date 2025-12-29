import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

// Routes Imports (Based on your folder structure)
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUsers from "./routes/adminUsers.js";
import linksRoutes from "./routes/linksRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import stepRoutes from "./routes/stepRoutes.js";
import trackRoutes from "./routes/trackRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. CORS Setup
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

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// 3. API ROUTES (Unga folder structure-la ulla ella route-aiyum register panniaachi)
app.use("/api/auth", adminAuthRoutes);     // Login/Register handle panna
app.use("/api/admin", adminRoutes);        // Admin dashboard-ku
app.use("/api/admin-users", adminUsers);   // Users-ai manage panna
app.use("/api/links", linksRoutes);        // Link shorting logic
app.use("/api/settings", settingsRoutes);  // Site settings-ku
app.use("/api/steps", stepRoutes);         // Step verification pages logic
app.use("/api/track", trackRoutes);        // Link clicks tracking
app.use("/api/wallet", walletRoutes);      // Wallet balances-ku
app.use("/api/withdraw", withdrawRoutes);  // Payment withdrawals-ku

// 4. STEP PAGES (Direct HTML access from public folder)
app.get("/step1/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step1.html")));
app.get("/step2/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step2.html")));
app.get("/step3/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step3.html")));
app.get("/step4/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step4.html")));
app.get("/final/:code", (_, res) => res.sendFile(path.join(__dirname, "public/final.html")));

// Health Check Route
app.get("/", (_, res) => res.status(200).send("KingLinky Backend API is Live!"));

// 5. Database Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// 6. Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});