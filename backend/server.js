import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import trackRoutes from "./routes/trackRoutes.js";
import linksRoutes from "./routes/linksRoutes.js";
import withdrawRoutes from "./routes/withdrawRoutes.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: [
    "https://kinglinky.com",
    "https://www.kinglinky.com",
    "https://api.kinglinky.com",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ROUTES
app.use("/api/track", trackRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/withdraw", withdrawRoutes);

// STEP PAGES
app.get("/step1/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step1.html")));
app.get("/step2/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step2.html")));
app.get("/step3/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step3.html")));
app.get("/step4/:code", (_, res) => res.sendFile(path.join(__dirname, "public/step4.html")));
app.get("/final/:code", (_, res) => res.sendFile(path.join(__dirname, "public/final.html")));

app.get("/", (_, res) => res.send("KingLinky API OK"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("Server running on 5000"));