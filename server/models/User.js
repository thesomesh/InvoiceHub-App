const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // USER INFO

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // BUSINESS INFO

    businessName: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    gstin: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    defaultTaxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    defaultNote: {
      type: String,
      default: "",
      trim: true,
    },
    timezone: {
  type: String,
  default: "Asia/Kolkata"
},
  },
  {
    timestamps: true,
  }
);

// HASH PASSWORD

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// COMPARE PASSWORD

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);