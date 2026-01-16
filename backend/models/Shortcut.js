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
    clickedIPs: {
      type: [String],
      default: [],
    },
    dailyClicks: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,   // 🔥 VERY IMPORTANT
  }
);

export default mongoose.model("Shortcut", shortcutSchema);