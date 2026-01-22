import mongoose from "mongoose";

const shortcutSchema = new mongoose.Schema(
  {
    fullUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    shortUrl: { type: String, required: true },
    ownerEmail: { type: String, required: true, index: true },
    clicks: { type: Number, default: 0 },
    dailyClicks: {
      type: Map,
      of: Number,
      default: {},
    },
    // 🔥 IP Tracking simplified to avoid Mongoose Map dot error
    countedVisitors: [
      {
        ip: String,
        date: String, // "2026-01-22"
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Shortcut", shortcutSchema);