/* Patch: shipping fee is non-refundable on returns.
 * - Schema: add shippingFee + refundableAmount fields
 * - Create: refundableAmount = totalAmount - deliveryFee
 * - Emails (applied + approved): show the breakdown
 * - Approve: cap refund at refundableAmount - extra deduction
 * - Owner email: includes shipping breakdown
 */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

function replaceOnce(oldStr, newStr, label) {
  if (!src.includes(oldStr)) {
    console.error("ANCHOR NOT FOUND — " + label);
    process.exit(1);
  }
  src = src.replace(oldStr, newStr, 1);
}

// 1. Schema fields.
replaceOnce(
  "    expectedAmount: { type: Number, default: 0 },\n    status: {",
  "    expectedAmount: { type: Number, default: 0 },\n    shippingFee: { type: Number, default: 0 },\n    refundableAmount: { type: Number, default: 0 },\n    status: {",
  "schema fields"
);

// 2. Create-time calculation.
replaceOnce(
  "        expectedAmount: Number(order.totalAmount || 0),\n      });",
  "        expectedAmount: Number(order.totalAmount || 0),\n        shippingFee: Number(order.deliveryFee || 0),\n        refundableAmount: Math.max(\n          0,\n          Number(order.totalAmount || 0) - Number(order.deliveryFee || 0)\n        ),\n      });",
  "create calculation"
);

// 3. Applied email breakdown.
replaceOnce(
  '    "        <tr><td style=\'padding:4px 0;\'>Expected refund</td><td style=\'text-align:right;font-weight:700;\'>₹" +\n' +
    '    Number(returnRequest.expectedAmount || 0).toFixed(2) +\n' +
    '    "</td></tr>\\n" +',
  '    "        <tr><td style=\'padding:4px 0;\'>Order total</td><td style=\'text-align:right;\'>₹" +\n' +
    '    Number(returnRequest.expectedAmount || 0).toFixed(2) +\n' +
    '    "</td></tr>\\n" +\n' +
    '    "        <tr><td style=\'padding:4px 0;\'>Shipping fee (non-refundable)</td><td style=\'text-align:right;color:#c0392b;\'>- ₹" +\n' +
    '    Number(returnRequest.shippingFee || 0).toFixed(2) +\n' +
    '    "</td></tr>\\n" +\n' +
    '    "        <tr><td style=\'padding:4px 0;\'>Amount refundable after approval</td><td style=\'text-align:right;font-weight:700;\'>₹" +\n' +
    '    Number(returnRequest.refundableAmount || 0).toFixed(2) +\n' +
    '    "</td></tr>\\n" +',
  "applied email breakdown"
);

// 4. Approved email breakdown.
replaceOnce(
  '    "        <tr><td style=\'padding:4px 0;\'>Expected refund</td><td style=\'text-align:right;\'>₹" +\n' +
    '    expected.toFixed(2) +\n' +
    '    "</td></tr>\\n" +\n' +
    '    "        <tr><td style=\'padding:4px 0;\'>Deductions</td><td style=\'text-align:right;color:#c0392b;\'>- ₹" +\n' +
    '    deduction.toFixed(2) +\n' +
    '    "</td></tr>\\n" +',
  '    "        <tr><td style=\'padding:4px 0;\'>Order total</td><td style=\'text-align:right;\'>₹" +\n' +
    '    expected.toFixed(2) +\n' +
    '    "</td></tr>\\n" +\n' +
    '    "        <tr><td style=\'padding:4px 0;\'>Shipping fee (non-refundable)</td><td style=\'text-align:right;color:#c0392b;\'>- ₹" +\n' +
    '    Number(returnRequest.shippingFee || 0).toFixed(2) +\n' +
    '    "</td></tr>\\n" +\n' +
    '    "        <tr><td style=\'padding:4px 0;\'>Extra deductions</td><td style=\'text-align:right;color:#c0392b;\'>- ₹" +\n' +
    '    deduction.toFixed(2) +\n' +
    '    "</td></tr>\\n" +',
  "approved email breakdown"
);

// 5. Approve cap — refund cannot exceed (refundable amount - extra deduction).
replaceOnce(
  "    if (refundAmount > Number(returnRequest.expectedAmount || 0) - deductionAmount) {\n" +
    "      return res.status(400).json({\n" +
    "        success: false,\n" +
    '        message: "Refund amount cannot exceed the expected refund minus the deduction",\n' +
    "      });\n" +
    "    }",
  "    const maxRefund =\n" +
    "      Number(\n" +
    "        returnRequest.refundableAmount || returnRequest.expectedAmount || 0\n" +
    "      ) - deductionAmount;\n" +
    "    if (refundAmount > maxRefund) {\n" +
    "      return res.status(400).json({\n" +
    "        success: false,\n" +
    '        message: "Refund cannot exceed the refundable amount (order total minus non-refundable shipping fee) minus the deduction",\n' +
    "      });\n" +
    "    }",
  "approve cap"
);

// 6. Owner email — shipping breakdown.
replaceOnce(
  '              "</p><p>Expected refund: ₹" +\n              Number(order.totalAmount || 0).toFixed(2) +\n',
  '              "</p><p>Order total: ₹" +\n              Number(order.totalAmount || 0).toFixed(2) +\n              "</p><p>Shipping fee (non-refundable): -₹" +\n              Number(order.deliveryFee || 0).toFixed(2) +\n              "</p><p>Refundable after approval: ₹" +\n              Math.max(0, Number(order.totalAmount || 0) - Number(order.deliveryFee || 0)).toFixed(2) +\n',
  "owner email breakdown"
);

fs.writeFileSync(file, src);
console.log(
  "Shipping-fee patch applied:",
  src.includes("shippingFee: { type: Number"),
  src.includes("refundableAmount: Math.max"),
  src.includes("Shipping fee (non-refundable)"),
  src.includes("const maxRefund")
);
