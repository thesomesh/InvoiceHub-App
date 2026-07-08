const User = require("../models/User");
const crypto = require("crypto");
const OTP = require("../models/OTP");
const sendOTP = require("../utils/sendOTP");
const sendWelcomeEmail = require("../utils/sendWelcomeEmail");
const { generateToken } = require("../utils/generateToken");

// CHECK DB

const ensureDbConnected = (res) => {
  if (User.db.readyState === 1) {
    return true;
  }

  res.status(503).json({
    message:
      "Database is not connected. Please check MongoDB connection.",
  });

  return false;
};

// REGISTER
const sendRegisterOTP = async (req, res) => {

    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
        email: normalizedEmail
    });

    if(existing){
        return res.status(400).json({
            message:"Email already exists"
        });
    }

   // Delete any previous OTP
await OTP.deleteMany({
    email: normalizedEmail,
    purpose: "register",
});

// Generate OTP
const otp = Math.floor(
    100000 + Math.random() * 900000
).toString();

// Hash OTP
const otpHash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

// Save OTP
await OTP.create({
    email: normalizedEmail,
    otpHash,
    purpose: "register",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
});

    await sendOTP(normalizedEmail, otp);

    res.json({
        message:"OTP sent successfully"
    });

};

const verifyRegisterOTP = async (req, res) => {

    const { email, otp } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const savedOTP = await OTP.findOne({
        email: normalizedEmail,
        purpose: "register",
    });

    if (!savedOTP) {
        return res.status(400).json({
            message: "OTP expired or not found.",
        });
    }

    const enteredHash = crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");

    if (savedOTP.otpHash !== enteredHash) {

        savedOTP.attempts += 1;
        await savedOTP.save();

        if (savedOTP.attempts >= 5) {

            await savedOTP.deleteOne();

            return res.status(429).json({
                message: "Too many invalid attempts.",
            });
        }

        return res.status(400).json({
            message: "Invalid OTP",
        });
    }

    // Don't delete OTP here yet.
    // Just tell frontend it is verified.

    return res.json({
        verified: true,
        message: "OTP verified successfully",
    });

};


const register = async (req, res, next) => {
  try {
    if (!ensureDbConnected(res)) return;

    const {
      name,
      email,
      password,
      otp,
      businessName,
      phone,
      address,
      gstin,
      defaultTaxRate,
      defaultNote,
    } = req.body;

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();
const savedOTP = await OTP.findOne({
    email: normalizedEmail,
    purpose: "register",
});

if (!savedOTP) {
    return res.status(400).json({
        message: "OTP expired or not found.",
    });
}

const enteredHash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

if (savedOTP.otpHash !== enteredHash) {

    savedOTP.attempts += 1;

    await savedOTP.save();

    if (savedOTP.attempts >= 5) {

        await savedOTP.deleteOne();

        return res.status(429).json({
            message: "Too many invalid attempts. Please request a new OTP.",
        });

    }

    return res.status(400).json({
        message: "Invalid OTP",
    });
}
const existingUser = await User.findOne({
    email: normalizedEmail,
});

// OTP verified
await savedOTP.deleteOne();
    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: String(name).trim(),

      email: normalizedEmail,

      password,
    emailVerified: true,
      businessName: String(
        businessName
      ).trim(),

      phone: String(phone).trim(),

      address: String(address).trim(),

      gstin: gstin
        ? String(gstin)
            .trim()
            .toUpperCase()
        : "",

      defaultTaxRate:
        Number(defaultTaxRate) || 0,

      defaultNote: String(
        defaultNote || ""
      ).trim(),
    });
await sendWelcomeEmail(user);
    const token = generateToken(user._id);

    res.status(201).json({
      message:
        "Account created successfully",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        businessName:
          user.businessName,

        phone: user.phone,

        address: user.address,

        gstin: user.gstin,

        defaultTaxRate:
          user.defaultTaxRate,

        defaultNote:
          user.defaultNote,
      },
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN

const login = async (req, res, next) => {
  try {
    if (!ensureDbConnected(res)) return;

    const { email, password } = req.body;

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        message:
          "No account found with this email",
      });
    }

    const isMatch =
      await user.comparePassword(
        password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        businessName:
          user.businessName,

        phone: user.phone,

        address: user.address,

        gstin: user.gstin,

        defaultTaxRate:
          user.defaultTaxRate,

        defaultNote:
          user.defaultNote,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET ME

const getMe = async (req, res, next) => {
  try {
    const user = req.user;

    res.status(200).json({
      id: user._id,

      name: user.name,

      email: user.email,

      businessName:
        user.businessName,

      phone: user.phone,

      address: user.address,

      gstin: user.gstin,

      defaultTaxRate:
        user.defaultTaxRate,

      defaultNote:
        user.defaultNote,

      createdAt:
        user.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE ME

const updateMe = async (
  req,
  res,
  next
) => {
  try {
    const updates = {
      phone: String(
        req.body.phone || ""
      ).trim(),

      address: String(
        req.body.address || ""
      ).trim(),

      gstin: req.body.gstin
        ? String(req.body.gstin)
            .trim()
            .toUpperCase()
        : "",

      defaultTaxRate:
        Number(
          req.body.defaultTaxRate
        ) || 0,

      defaultNote: String(
        req.body.defaultNote || ""
      ).trim(),
    };

    const user =
      await User.findByIdAndUpdate(
        req.user._id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      id: user._id,

      name: user.name,

      email: user.email,

      businessName:
        user.businessName,

      phone: user.phone,

      address: user.address,

      gstin: user.gstin,

      defaultTaxRate:
        user.defaultTaxRate,

      defaultNote:
        user.defaultNote,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
    sendRegisterOTP,
       verifyRegisterOTP,
  register,
  login,
  getMe,
  updateMe,

};