// Follow-up fixes for abandoned cart recovery:
//  1. Email CTA uses the production storefront URL (seoSiteUrl), never the
//     localhost clientUrl fallback.
//  2. Atomic claim (pending → processing) so concurrent schedulers / restarts
//     can never email the same cart twice.
//  3. Reuse the existing xmlEscape helper instead of a duplicate.
//  4. Add a "processing" status to the schema enum.
const fs = require("fs");
const path = require("path");

const backendFile = path.resolve(
  __dirname,
  "../../dealroot-backend/src/server.js"
);

let source = fs.readFileSync(backendFile, "utf8");
let changed = 0;

const apply = (label, oldText, newText, count = 1) => {
  if (!source.includes(oldText)) {
    console.error("SKIP [" + label + "]: anchor not found");
    return;
  }
  source = source.split(oldText).join(newText);
  changed += 1;
  console.log("OK [" + label + "]");
};

// 1. Production-safe email link
apply(
  "siteUrl → seoSiteUrl",
  "const siteUrl = String(clientUrl).replace(/\\/+$/, \"\");",
  "const siteUrl = seoSiteUrl;"
);

// 2. Reuse xmlEscape (drop the duplicate helper, swap usages)
apply(
  "remove cartHtmlEscape helper",
  "const cartHtmlEscape = (value) =>\n  String(value ?? \"\")\n    .replace(/&/g, \"&amp;\")\n    .replace(/</g, \"&lt;\")\n    .replace(/>/g, \"&gt;\")\n    .replace(/\"/g, \"&quot;\");\n",
  ""
);
apply("cartHtmlEscape → xmlEscape", "cartHtmlEscape(", "xmlEscape(", 3);

// 3. Schema: add "processing" status
apply(
  "schema enum",
  'status: { type: String, enum: ["pending", "emailed"], default: "pending" },',
  'status: { type: String, enum: ["pending", "processing", "emailed"], default: "pending" },'
);

// 4. Atomic claim in the scan
const oldScan = `async function runCartRecoveryScan() {
  try {
    const cutoff = new Date(Date.now() - cartRecoveryHours * 3600 * 1000);

    const carts = await AbandonedCart.find({
      status: "pending",
      email: { $ne: "" },
      lastSeenAt: { $lte: cutoff },
    }).limit(20);

    for (const cart of carts) {
      try {
        const coupon = await createRecoveryCoupon();

        if (!coupon) {
          console.error("Cart recovery: could not create a coupon");
          continue;
        }

        await sendAbandonedCartEmail(cart, coupon);

        cart.couponCode = coupon.code;
        cart.couponId = coupon._id;
        cart.status = "emailed";
        cart.emailSentAt = new Date();
        await cart.save();

        console.log(
          "Cart recovery email sent to " + cart.email + " (" + coupon.code + ")"
        );
      } catch (error) {
        console.error("Cart recovery failed for " + cart.email + ":", error.message);
      }
    }

    return carts.length;
  } catch (error) {
    console.error("Cart recovery scan error:", error.message);
    return 0;
  }
}`;

const newScan = `async function runCartRecoveryScan() {
  try {
    const cutoff = new Date(Date.now() - cartRecoveryHours * 3600 * 1000);

    const candidates = await AbandonedCart.find({
      status: "pending",
      email: { $ne: "" },
      lastSeenAt: { $lte: cutoff },
    })
      .select("_id")
      .limit(20);

    for (const candidate of candidates) {
      // Atomically claim the cart so a concurrent scheduler (or a restart
      // mid-scan) can never email the same cart twice.
      const cart = await AbandonedCart.findOneAndUpdate(
        { _id: candidate._id, status: "pending" },
        { $set: { status: "processing" } },
        { new: true }
      );

      if (!cart) continue;

      try {
        const coupon = await createRecoveryCoupon();

        if (!coupon) {
          await AbandonedCart.updateOne(
            { _id: cart._id },
            { $set: { status: "pending" } }
          );
          continue;
        }

        await sendAbandonedCartEmail(cart, coupon);

        cart.couponCode = coupon.code;
        cart.couponId = coupon._id;
        cart.status = "emailed";
        cart.emailSentAt = new Date();
        await cart.save();

        console.log(
          "Cart recovery email sent to " + cart.email + " (" + coupon.code + ")"
        );
      } catch (error) {
        console.error(
          "Cart recovery failed for " + cart.email + ":", error.message
        );
        // Transient failure (e.g. SMTP down) — allow a retry next scan.
        await AbandonedCart.updateOne(
          { _id: cart._id },
          { $set: { status: "pending" } }
        );
      }
    }

    return candidates.length;
  } catch (error) {
    console.error("Cart recovery scan error:", error.message);
    return 0;
  }
}`;

apply("atomic claim scan", oldScan, newScan);

fs.writeFileSync(backendFile, source, "utf8");
console.log("DONE — " + changed + " fix(es) applied.");
