/* Mongoose 9.7.4 passes `next` as an object (not a function), which breaks the
 * classic callback-style pre("save") hook. Convert to the async style and
 * remove the temporary debug logging from the order placement catch block. */
const fs = require("fs");
const path = require("path");
const serverPath = path.join(__dirname, "..", "..", "dealroot-backend", "src", "server.js");

let code = fs.readFileSync(serverPath, "utf8");
let changed = 0;

// 1. Fix the pre-save hook.
const oldHook = `// Seed the status timeline for brand-new orders (Placed at creation time).
orderSchema.pre("save", function (next) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      { status: this.orderStatus || "placed", at: new Date() },
    ];
  }
  next();
});`;

const newHook = `// Seed the status timeline for brand-new orders (Placed at creation time).
// NOTE: Mongoose 9 passes \`next\` as an object, so use the async-hook style.
orderSchema.pre("save", async function () {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      { status: this.orderStatus || "placed", at: new Date() },
    ];
  }
});`;

if (code.includes(oldHook)) {
  code = code.replace(oldHook, newHook);
  changed++;
  console.log("pre-save hook converted to async");
} else {
  console.log("WARN: pre-save hook block not found verbatim — checking current form");
}

// 2. Remove debug logging.
const debugLine = `    console.error("[ORDER-DEBUG] error.stack:", error && error.stack ? error.stack : String(error));
`;
if (code.includes(debugLine)) {
  code = code.replace(debugLine, "");
  changed++;
  console.log("debug stack logging removed");
} else {
  console.log("WARN: debug line not found");
}

fs.writeFileSync(serverPath, code);
console.log(changed + " change(s) applied");
