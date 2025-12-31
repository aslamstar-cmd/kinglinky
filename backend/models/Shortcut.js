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

    /* ======================
       CLICK TRACKING
    ====================== */
    clicks: {
      type: Number,
      default: 0,
    },

    // 🔥 IMPORTANT – duplicate protection
    clickedFPs: {
      type: [String],
      default: [],
    },

    // 🔥 IMPORTANT – today earnings calculation
    dailyClicks: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

export default mongoose.models.Shortcut ||
  mongoose.model("Shortcut", shortcutSchema);
