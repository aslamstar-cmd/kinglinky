import mongoose from "mongoose";

const shortcutSchema = new mongoose.Schema(
  {
    fullUrl: String,
    shortCode: String,
    shortUrl: String,
    ownerEmail: String,
    clicks: { type: Number, default: 0 },

    // ✅ SAME NAME everywhere
    clickedFPs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Shortcut", shortcutSchema);
