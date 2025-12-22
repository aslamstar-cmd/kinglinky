import mongoose from "mongoose";

const shortcutSchema = new mongoose.Schema(
  {
    fullUrl: String,
    shortCode: String,
    shortUrl: String,
    ownerEmail: String,
    clicks: { type: Number, default: 0 },
    clickedIPs: [String],
    clickedFps:[String],
  },
  { timestamps: true } // 🔥 THIS IS IMPORTANT
);

export default mongoose.model("Shortcut", shortcutSchema);