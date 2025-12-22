import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema(
  {
    userId: { type: String },            // 🔹 optional, but useful
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending" }, // pending → paid
    note: String,
  },
  { timestamps: true }                   // createdAt, updatedAt auto
);

export default mongoose.model("Withdraw", withdrawSchema);