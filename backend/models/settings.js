import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "Kinglinky" },
    cpm: { type: Number, default: 10 },
    minWithdraw: { type: Number, default: 5 },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);