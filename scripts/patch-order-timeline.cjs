// Backend patch: order status timeline support.
//  1. statusHistory array on the Order schema + pre-save seed for new orders.
//  2. Status-change email to the customer on PATCH /api/orders/:id/status and
//     on cancellation (with ORDER_STATUS_EMAIL_DRY_RUN guard for testing).
//  3. Append every status change (incl. cancelled) to statusHistory.
//  4. Fix the order-email trackUrl localhost fallback → production URL.
const fs = require("fs");
const path = require("path");

const backendFile = path.resolve(
  __dirname,
  "../../dealroot-backend/src/server.js"
);

let source = fs.readFileSync(backendFile, "utf8");
let changed = 0;

const apply = (label, oldText, newText) => {
  if (!source.includes(oldText)) {
    console.error("SKIP [" + label + "]: anchor not found");
    return false;
  }
  source = source.split(oldText).join(newText);
  changed += 1;
  console.log("OK [" + label + "]");
  return true;
};

// 1a. Schema: statusHistory field
apply(
  "schema statusHistory",
  `    orderStatus: {
      type: String,
      enum: orderStatuses,
      default: "placed",
    },
    stockRestored: { type: Boolean, default: false },`,
  `    orderStatus: {
      type: String,
      enum: orderStatuses,
      default: "placed",
    },
    // Timestamped history of every status change (newest last) — powers the
    // customer's order status timeline.
    statusHistory: [
      {
        status: { type: String, enum: orderStatuses },
        at: { type: Date, default: Date.now },
      },
    ],
    stockRestored: { type: Boolean, default: false },`
);

// 1b. Pre-save seed for new orders (must be registered before first save).
apply(
  "pre-save seed",
  `    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const paymentSessionSchema = new mongoose.Schema(`,
  `    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Seed the status timeline for brand-new orders (Placed at creation time).
orderSchema.pre("save", function (next) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      { status: this.orderStatus || "placed", at: new Date() },
    ];
  }
  next();
});

const paymentSessionSchema = new mongoose.Schema(`
);

// 2. sendOrderStatusEmail + helpers (inserted before the status endpoint).
apply(
  "status email function",
  'app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {',
  `const orderStatusLabels = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  packed: "Order Packed",
  shipped: "Order Shipped",
  delivered: "Order Delivered",
  cancelled: "Order Cancelled",
};

const orderStatusEmojis = {
  placed: "📦",
  confirmed: "✅",
  packed: "🧳",
  shipped: "🚚",
  delivered: "🏠",
  cancelled: "❌",
};

// Notify the customer by email whenever their order status changes.
async function sendOrderStatusEmail(order) {
  if (!order) return;

  const customerEmail =
    String(order.customer?.email || "").trim() ||
    (order.user
      ? (await User.findOne({ _id: order.user }).select("email"))?.email
      : "") ||
    "";

  if (!customerEmail) return;

  if (process.env.ORDER_STATUS_EMAIL_DRY_RUN === "true") {
    console.log(
      "[dry-run] Status email " + order.orderNumber + " → " + order.orderStatus
    );
    return;
  }

  const label = orderStatusLabels[order.orderStatus] || order.orderStatus;
  const emoji = orderStatusEmojis[order.orderStatus] || "📦";
  const siteUrl = seoSiteUrl;
  const trackUrl = siteUrl + "/account";

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;">\\n' +
    '  <div style="background:#e21c48;padding:22px 28px;text-align:center;">\\n' +
    '    <h1 style="color:#fff;margin:0;font-size:20px;">DEALROOT BEAUTY</h1>\\n' +
    '    <p style="color:#ffe4e9;margin:6px 0 0;font-size:13px;">Your order is on the move 🛍️</p>\\n' +
    "  </div>\\n" +
    '  <div style="padding:28px;">\\n' +
    '    <p style="font-size:14px;color:#333;">Hi ' +
    xmlEscape(order.customer?.name || "there") +
    ",</p>\\n" +
    '    <div style="background:#fff5f7;border:1px solid #ffd6de;border-radius:10px;padding:16px 20px;margin:18px 0;text-align:center;">\\n' +
    '      <span style="font-size:44px;line-height:1;">' +
    emoji +
    "</span>\\n" +
    '      <h2 style="margin:8px 0 4px;font-size:20px;color:#e21c48;">' +
    label +
    "</h2>\\n" +
    '      <span style="font-size:12px;color:#999;">Order ' +
    order.orderNumber +
    "</span>\\n" +
    "    </div>\\n" +
    '    <p style="font-size:14px;color:#555;line-height:1.6;">' +
    (order.orderStatus === "delivered"
      ? "Your order has been delivered. We hope you love it! A gentle reminder — you can review your products anytime."
      : order.orderStatus === "shipped"
      ? "Great news — your order is out for delivery and will reach you soon."
      : "We're updating you on the progress of your order.") +
    "</p>\\n" +
    '    <a href="' +
    trackUrl +
    '" style="display:block;text-align:center;background:#e21c48;color:#fff;text-decoration:none;padding:14px;border-radius:999px;font-size:14px;font-weight:700;">Track your order</a>\\n' +
    '    <p style="font-size:12px;color:#999;margin-top:20px;line-height:1.6;text-align:center;">Questions? Reach us at dealroot.store@gmail.com or @Tom_andrew72 on Telegram.</p>\\n' +
    "  </div>\\n" +
    "</div>";

  await transporter.sendMail({
    from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
    to: customerEmail,
    subject: emoji + " " + label + " — " + order.orderNumber,
    html,
  });
}

app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {`
);

// 3. Status endpoint: history + notification (replace the update block).
apply(
  "status endpoint update",
  `    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });`,
  `    const previous = await Order.findById(req.params.id);

    if (!previous) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus,
        $push: {
          statusHistory: { status: orderStatus, at: new Date() },
        },
      },
      { new: true, runValidators: true }
    );

    if (orderStatus !== previous.orderStatus) {
      sendOrderStatusEmail(order).catch((error) =>
        console.error("Order status email failed:", error.message)
      );
    }

    res.json({
      success: true,
      message:
        orderStatus !== previous.orderStatus
          ? "Order marked as " +
            orderStatus +
            " — customer notified by email"
          : "Order status is already " + orderStatus,
      order,
    });`
);

// 4. Cancel endpoint: append cancelled to history.
apply(
  "cancel history",
  `      order.orderStatus = "cancelled";
      order.stockRestored = true;
      order.cancelledAt = new Date();`,
  `      order.orderStatus = "cancelled";
      order.stockRestored = true;
      order.cancelledAt = new Date();
      order.statusHistory.push({ status: "cancelled", at: new Date() });`
);

// 4b. Cancel endpoint: email after the transaction.
apply(
  "cancel email",
  `    res.json({
      success: true,
      message: "Order cancelled and stock restored",
      order,
    });`,
  `    sendOrderStatusEmail(order).catch((error) =>
      console.error("Cancellation email failed:", error.message)
    );

    res.json({
      success: true,
      message: "Order cancelled and stock restored",
      order,
    });`
);

// 5. Fix the localhost trackUrl in the order-confirmation emails.
apply(
  "trackUrl fix",
  '  const trackUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/account`;',
  '  const trackUrl = seoSiteUrl + "/account";'
);

fs.writeFileSync(backendFile, source, "utf8");
console.log("DONE — " + changed + " patch(es) applied.");
