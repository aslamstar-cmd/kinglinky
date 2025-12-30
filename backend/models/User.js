import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // 🔹 Intha rendu field thaan mukkiyam
  wallet: { 
    type: Number, 
    default: 0 
  }, 
  totalEarnings: { 
    type: Number, 
    default: 0 
  },
  referralCode: { type: String, default: "" },
  referralBy: { type: String, default: null },
  referralEarnings: { type: Number, default: 0 }, // Spelling fixed
  firstLoginRewardGiven: { type: Boolean, default: false },
},
 { timestamps: true }
);

export default mongoose.model("User", userSchema);