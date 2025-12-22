import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  role: { type: String, default: "admin" }
}, { timestamps: true });

export default mongoose.model("admin", adminSchema);
