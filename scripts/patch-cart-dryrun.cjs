// One-off patch: add a CART_RECOVERY_DRY_RUN guard to sendAbandonedCartEmail
// so the recovery flow can be tested without sending real emails.
const fs = require("fs");
const path = require("path");

const backendFile = path.resolve(
  __dirname,
  "../../dealroot-backend/src/server.js"
);

const anchor =
  'async function sendAbandonedCartEmail(cart, coupon) {\n  const siteUrl = String(clientUrl).replace(/\\/+$/, "");';

const guard = `
  if (process.env.CART_RECOVERY_DRY_RUN === "true") {
    console.log("[dry-run] Would email " + cart.email + " with coupon " + coupon.code);
    return;
  }`;

const source = fs.readFileSync(backendFile, "utf8");

if (source.includes("CART_RECOVERY_DRY_RUN")) {
  console.log("ALREADY PATCHED — dry-run guard present.");
  process.exit(0);
}

if (!source.includes(anchor)) {
  console.error("ERROR: could not find sendAbandonedCartEmail anchor.");
  process.exit(1);
}

fs.writeFileSync(
  backendFile,
  source.replace(anchor, anchor + guard),
  "utf8"
);

console.log("PATCHED: dry-run guard added to sendAbandonedCartEmail.");
