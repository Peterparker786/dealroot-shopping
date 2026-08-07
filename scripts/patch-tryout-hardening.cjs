// Hardening: whitelist previousProgram + honor ORDER_STATUS_EMAIL_DRY_RUN for the owner email.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "..", "dealroot-backend", "src", "server.js");
let src = fs.readFileSync(file, "utf8");
let count = 0;

function replace(oldStr, newStr) {
  if (!src.includes(oldStr)) {
    console.error("NOT FOUND:\n" + oldStr.slice(0, 180) + "\n---");
    process.exitCode = 1;
    return;
  }
  src = src.split(oldStr).join(newStr);
  count += 1;
}

// 1) Whitelist previousProgram values.
replace(
  `    if (previousProgram === "Other" && !otherProgram) {
      return res.status(400).json({ success: false, message: "Please tell us the name of the other program" });
    }`,
  `    if (previousProgram === "Other" && !otherProgram) {
      return res.status(400).json({ success: false, message: "Please tell us the name of the other program" });
    }
    const TRYOUT_PROGRAMS = ["Freekamaal", "Trybox", "OPA", "Other"];
    if (previousProgram && !TRYOUT_PROGRAMS.includes(previousProgram)) {
      return res.status(400).json({ success: false, message: "Please select a valid option for the previous program" });
    }`
);

// 2) Honor the email dry-run flag for the owner notification.
replace(
  `    // Notify the owner about the new application with the full form details.
    if (process.env.ADMIN_EMAIL) {
      const prevLabel =`,
  `    // Notify the owner about the new application with the full form details.
    if (process.env.ADMIN_EMAIL) {
      if (process.env.ORDER_STATUS_EMAIL_DRY_RUN === "true") {
        console.log("[dry-run] Tryout owner email → " + name);
      } else {
      const prevLabel =`
);

replace(
  `        .catch((err) => console.error("Tryout owner email failed:", err.message));
    }`,
  `        .catch((err) => console.error("Tryout owner email failed:", err.message));
      }
    }`
);

fs.writeFileSync(file, src);
console.log("Hardening applied (" + count + " replacements).");
