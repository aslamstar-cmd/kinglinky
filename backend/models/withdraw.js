import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending" }, // pending → paid
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model("Withdraw", withdrawSchema);