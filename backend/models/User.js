import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wallet: { type: Number, default: 0 }, 
  totalEarnings: { type: Number, default: 0 },
  referralCode: { type: String, default: "" },
  referralBy: { type: String, default: null },
  referralEarnings: { type: Number, default: 0 },
  firstLoginRewardGiven: { type: Boolean, default: false },
}, { timestamps: true });

// INTHA LINE THAAN MUKKIYAM (Error-ah fix panna)
export default mongoose.models.User || mongoose.model("User", userSchema);