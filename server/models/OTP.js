const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },

    otpHash: {
        type: String,
        required: true,
    },

    purpose: {
        type: String,
        enum: ["register", "forgot-password"],
        required: true,
    },

    attempts: {
        type: Number,
        default: 0,
    },

    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("OTP", otpSchema);