import mongoose from "mongoose";

const shortUrlSchema = new mongoose.Schema({
    full: {
        type: String,
        required: true,
    },
    short: {
        type: String,
        requird: true,
    },
    clicks: {
        type: Number,
        required: true,
        default: 0,
    },
});

export default mongoose.model("ShortUrl", shortUrlSchema);