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
  referralCode: {type: String, default:""},
  referralBy:{type: String, default:null},
  referralEarnings:{type: Number, deafault: 0},
  firstLoginRewardGiven: {type: Boolean, default: false},
},
 { timestamps: true}
);


export default mongoose.model("User", userSchema);