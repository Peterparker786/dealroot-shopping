// One-off patch: add "new phone already registered" checks to the backend's
// request-phone-change and verify-phone-change endpoints.
// Usage: node scripts/patch-backend-phone-check.cjs
const fs = require("fs");
const path = require("path");

const SERVER = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";

if (!fs.existsSync(SERVER)) {
  console.error("Backend server.js not found:", SERVER);
  process.exit(1);
}

const source = fs.readFileSync(SERVER, "utf8");

const replacements = [
  {
    old: `    if (newPhone === user.phone) {
      return res.status(400).json({ success: false, message: "This is already your mobile number" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingPhone = newPhone;
    user.pendingEmail = "";`,
    new: `    if (newPhone === user.phone) {
      return res.status(400).json({ success: false, message: "This is already your mobile number" });
    }

    // Reject numbers already registered to another account.
    const takenPhone = await User.exists({
      phone: newPhone,
      _id: { $ne: user._id },
    });

    if (takenPhone) {
      return res.status(409).json({ success: false, message: "An account with this mobile number already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingPhone = newPhone;
    user.pendingEmail = "";`,
  },
  {
    old: `    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    user.phone = user.pendingPhone;`,
    new: `    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    // Re-check the new number is still free (another account may have taken
    // it between the request and the verification).
    const takenPhone = await User.exists({
      phone: user.pendingPhone,
      _id: { $ne: user._id },
    });

    if (takenPhone) {
      user.pendingPhone = "";
      user.changeOTP = "";
      user.otpExpiry = null;
      await user.save();
      return res.status(409).json({ success: false, message: "An account with this mobile number already exists" });
    }

    user.phone = user.pendingPhone;`,
  },
];

let updated = source;

for (const { old, new: next } of replacements) {
  const count = updated.split(old).length - 1;
  if (count !== 1) {
    console.error(`Expected exactly 1 match, found ${count} — aborting before any write.`);
    process.exit(1);
  }
  updated = updated.replace(old, next);
  console.log(`✓ replaced (1 match)`);
}

fs.writeFileSync(SERVER, updated, "utf8");
console.log("Backend server.js patched.");
