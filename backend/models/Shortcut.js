import mongoose from "mongoose";

const shortcutSchema = new mongoose.Schema(
  {
    fullUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    shortUrl: { type: String, required: true },
    ownerEmail: { type: String, required: true, index: true },
    clicks: { type: Number, default: 0 },

    // Date => Count mapping-ku idhu okay
    dailyClicks: {
      type: Map,
      of: Number,
      default: {},
    },

    // IP tracking-ku Array use pannuvom (Dots problem varaathu)
    countedVisitors: [
      {
        ip: String,
        date: String, // format: "2026-01-22"
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Shortcut", shortcutSchema);