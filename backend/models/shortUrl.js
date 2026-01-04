import mongoose from "mongoose";

const shortcutSchema = new mongoose.Schema(
  {
    fullUrl: String,
    shortCode: String,
    shortUrl: String,
    ownerEmail: String,

    clicks: { type: Number, default: 0 },

    // ✅ ADD THIS
    dailyClicks: {
      type: Map,
      of: Number,
      default: {}
    },

    clickedFPs: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Shortcut", shortcutSchema);
