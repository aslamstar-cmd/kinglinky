import mongoose from "mongoose";

const shortcutSchema = new mongoose.Schema(
  {
    fullUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
    },
    shortUrl: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      index: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },

    // 🔥 DAILY CLICKS (date => count)
    dailyClicks: {
      type: Map,
      of: Number,
      default: {},
    },

    // 🔒 ONE COUNT PER DAY PER USER/IP
    countedVisitors: {
      type: Map,
      of: String,   // ✅ FIXED (WAS Date ❌)
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Shortcut", shortcutSchema);