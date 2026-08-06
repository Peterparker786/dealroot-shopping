const fs = require("fs");
const p = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
const src = fs.readFileSync(p, "utf8");
let next = src;

const edits = [];

// 1) /api/orders — replace the hardcoded WELCOME10 validation with the real
//    Coupon lookup (active, not expired, minimum order) + real discount math.
edits.push({
  from: `    if (normalizedCoupon && normalizedCoupon !== "WELCOME10") {
      throw new Error("Invalid coupon code");
    }

    let order;`,
  to: `    let couponRecord = null;

    if (normalizedCoupon) {
      couponRecord = await Coupon.findOne({
        code: normalizedCoupon,
        active: true,
      });

      if (!couponRecord) {
        throw new Error("Invalid coupon code");
      }

      if (
        couponRecord.expiryDate &&
        new Date(couponRecord.expiryDate) < new Date()
      ) {
        throw new Error("Coupon expired");
      }
    }

    let order;`,
});

// 2) /api/orders — replace the WELCOME10 discount block with real coupon math.
edits.push({
  from: `      let discountAmount = 0;

      if (normalizedCoupon === "WELCOME10") {
        if (subtotal <= 499) {
          throw new Error(
            "WELCOME10 applies only when the cart subtotal is above â‚¹499"
          );
        }

        discountAmount = Math.round(subtotal * 0.1);
      }`,
  to: `      let discountAmount = 0;

      if (couponRecord) {
        if (subtotal < couponRecord.minimumOrder) {
          throw new Error(
            "Minimum order \u20b9" + couponRecord.minimumOrder + " for this coupon"
          );
        }

        if (couponRecord.discountType === "percentage") {
          discountAmount = Math.round(
            (subtotal * couponRecord.discountValue) / 100
          );

          if (
            couponRecord.maximumDiscount &&
            discountAmount > couponRecord.maximumDiscount
          ) {
            discountAmount = couponRecord.maximumDiscount;
          }
        } else {
          discountAmount = Math.min(
            couponRecord.discountValue,
            subtotal
          );
        }
      }`,
});

let applied = 0;
for (const e of edits) {
  if (!next.includes(e.from)) {
    console.error("MARKER NOT FOUND:\n" + e.from.slice(0, 120));
    process.exit(1);
  }
  next = next.replace(e.from, e.to);
  applied += 1;
}

fs.writeFileSync(p, next);
console.log("Coupon fix applied:", applied, "of", edits.length);
