// One-off patch: add the abandoned cart recovery system to the backend.
// Inserts the AbandonedCart model, /api/cart/save route, admin endpoints,
// recovery scan (email + coupon) and scheduler before startServer().
const fs = require("fs");
const path = require("path");

const backendFile = path.resolve(
  __dirname,
  "../../dealroot-backend/src/server.js"
);

const anchor = "const startServer = async () => {";

const newBlock = `
// ===========================
// ABANDONED CART RECOVERY
// ===========================
const abandonedCartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    email: { type: String, default: "", lowercase: true, trim: true },
    name: { type: String, default: "" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: { type: String, default: "" },
        brand: { type: String, default: "" },
        price: { type: Number, default: 0 },
        image: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        subtotal: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    status: { type: String, enum: ["pending", "emailed"], default: "pending" },
    lastSeenAt: { type: Date, default: Date.now },
    emailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);
const AbandonedCart = mongoose.model("AbandonedCart", abandonedCartSchema);

// Config (override via env on Render/local)
const cartRecoveryHours = Number(process.env.CART_RECOVERY_HOURS || 1);
const cartRecoveryDiscount = Number(process.env.CART_RECOVERY_DISCOUNT || 10);
const cartRecoveryMinOrder = Number(process.env.CART_RECOVERY_MIN_ORDER || 499);
const cartRecoveryMaxDiscount = Number(process.env.CART_RECOVERY_MAX_DISCOUNT || 150);
const cartRecoveryValidHours = Number(process.env.CART_RECOVERY_VALID_HOURS || 72);

const cartHtmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Save a logged-in user's cart snapshot so we can recover it later. Sending an
// empty items array (or an empty cart after checkout) clears the snapshot.
app.post("/api/cart/save", requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (rawItems.length === 0) {
      await AbandonedCart.deleteOne({ user: user._id });
      return res.json({ success: true, message: "Cart cleared" });
    }

    // Normalise against the real catalogue (server-side prices, never trust
    // the client for price/title).
    const items = [];
    let subtotal = 0;

    for (const item of rawItems.slice(0, 50)) {
      const productId = String(item?.productId || "");
      if (!mongoose.Types.ObjectId.isValid(productId)) continue;

      const product = await Product.findById(productId);
      if (!product) continue;

      const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 99));
      const lineTotal = Math.round(product.price * quantity * 100) / 100;
      subtotal += lineTotal;

      items.push({
        product: product._id,
        title: product.title,
        brand: product.brand,
        price: product.price,
        image: product.images?.[0] || "",
        quantity,
        subtotal: lineTotal,
      });
    }

    if (items.length === 0) {
      return res.json({ success: true, message: "Nothing to save" });
    }

    const existing = await AbandonedCart.findOne({ user: user._id });

    await AbandonedCart.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          email: user.email,
          name: user.name,
          items,
          subtotal: Math.round(subtotal * 100) / 100,
          lastSeenAt: new Date(),
          // Never re-email within the same abandoned episode.
          status: existing?.status === "emailed" ? "emailed" : "pending",
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Cart saved" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: list recent abandoned carts.
app.get("/api/admin/cart-recovery", requireAdmin, async (req, res) => {
  try {
    const carts = await AbandonedCart.find()
      .sort({ lastSeenAt: -1 })
      .limit(25);
    res.json({ success: true, carts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Creates a unique discount coupon for one abandoned cart. Reuses the real
// Coupon collection so checkout applies it like any admin-created coupon.
async function createRecoveryCoupon() {
  let code = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate =
      "CART" +
      cartRecoveryDiscount +
      "-" +
      crypto.randomBytes(3).toString("hex").toUpperCase();

    const exists = await Coupon.findOne({ code: candidate });
    if (!exists) {
      code = candidate;
      break;
    }
  }

  if (!code) return null;

  return Coupon.create({
    code,
    discountType: "percentage",
    discountValue: cartRecoveryDiscount,
    minimumOrder: cartRecoveryMinOrder,
    maximumDiscount: cartRecoveryMaxDiscount,
    expiryDate: new Date(Date.now() + cartRecoveryValidHours * 3600 * 1000),
    active: true,
  });
}

async function sendAbandonedCartEmail(cart, coupon) {
  const siteUrl = String(clientUrl).replace(/\\/+$/, "");

  const itemsHtml = (cart.items || [])
    .map(
      (item) =>
        "      <tr>\\n" +
        '        <td style="padding:12px;border-bottom:1px solid #eee;">\\n' +
        "          <table><tr>\\n" +
        '            <td style="padding-right:14px;">' +
        (item.image
          ? '<img src="' + item.image + '" width="60" height="76" style="border-radius:8px;object-fit:cover;" alt="" />'
          : "") +
        "</td>\\n" +
        '            <td style="vertical-align:middle;">\\n' +
        '              <strong style="font-size:13px;color:#333;display:block;">' +
        cartHtmlEscape(item.title) +
        "</strong>\\n" +
        '              <span style="color:#999;font-size:12px;">' +
        cartHtmlEscape(item.brand || "") +
        " &bull; Qty: " +
        item.quantity +
        "</span>\\n" +
        "            </td>\\n" +
        "          </tr></table>\\n" +
        "        </td>\\n" +
        '        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;font-size:14px;color:#333;font-weight:600;">₹' +
        item.price +
        "</td>\\n" +
        "      </tr>"
    )
    .join("\\n");

  const subject =
    "Your DEALROOT cart is waiting — " + cartRecoveryDiscount + "% off!";

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;">\\n' +
    '  <div style="background:#e21c48;padding:22px 28px;text-align:center;">\\n' +
    '    <h1 style="color:#fff;margin:0;font-size:20px;">DEALROOT BEAUTY</h1>\\n' +
    '    <p style="color:#ffe4e9;margin:6px 0 0;font-size:13px;">You left something beautiful behind 💄</p>\\n' +
    "  </div>\\n" +
    '  <div style="padding:28px;">\\n' +
    '    <p style="font-size:14px;color:#333;">Hi ' +
    cartHtmlEscape(cart.name || "there") +
    ",</p>\\n" +
    '    <p style="font-size:14px;color:#555;line-height:1.6;">Your cart is still saved and waiting for you. Complete your order in the next few days and enjoy <strong style="color:#e21c48;">' +
    cartRecoveryDiscount +
    "% off</strong> — it's our little nudge to treat yourself.</p>\\n" +
    '    <div style="background:#fff5f7;border:1px solid #ffd6de;border-radius:10px;padding:16px 20px;margin:18px 0;text-align:center;">\\n' +
    '      <span style="font-size:12px;color:#999;display:block;margin-bottom:6px;">USE THIS CODE AT CHECKOUT</span>\\n' +
    '      <span style="font-size:26px;font-weight:800;color:#e21c48;letter-spacing:3px;">' +
    coupon.code +
    "</span>\\n" +
    '      <span style="font-size:12px;color:#999;display:block;margin-top:8px;">' +
    cartRecoveryDiscount +
    "% off up to ₹" +
    cartRecoveryMaxDiscount +
    " &bull; Min. order ₹" +
    cartRecoveryMinOrder +
    " &bull; Valid " +
    cartRecoveryValidHours +
    " hours</span>\\n" +
    "    </div>\\n" +
    '    <a href="' +
    siteUrl +
    '" style="display:block;text-align:center;background:#e21c48;color:#fff;text-decoration:none;padding:14px;border-radius:999px;font-size:14px;font-weight:700;">Return to your cart</a>\\n' +
    '    <p style="font-size:12px;color:#999;margin-top:20px;line-height:1.6;text-align:center;">Questions? Reach us at dealroot.store@gmail.com or @Tom_andrew72 on Telegram.</p>\\n' +
    "  </div>\\n" +
    "</div>";

  await transporter.sendMail({
    from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
    to: cart.email,
    subject,
    html,
  });
}

async function runCartRecoveryScan() {
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
}

// Run the scan on demand (admin button / curl).
app.post("/api/admin/cart-recovery/run", requireAdmin, async (req, res) => {
  try {
    const sent = await runCartRecoveryScan();
    res.json({
      success: true,
      message: "Recovery scan complete — " + sent + " email(s) sent",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scheduled scan: on startup + every 15 minutes.
function startCartRecoveryScheduler() {
  runCartRecoveryScan().catch(() => {});
  setInterval(() => {
    runCartRecoveryScan().catch(() => {});
  }, 15 * 60 * 1000);
  console.log("Abandoned cart recovery scheduler started (every 15 min)");
}

`;

const source = fs.readFileSync(backendFile, "utf8");

if (source.includes("const AbandonedCart = mongoose.model")) {
  console.log("ALREADY PATCHED — abandoned cart recovery already present.");
  process.exit(0);
}

if (!source.includes(anchor)) {
  console.error("ERROR: could not find the startServer anchor.");
  process.exit(1);
}

const updated = source.replace(anchor, newBlock + anchor);

// Also start the scheduler right after the DB connects.
const connectAnchor = 'console.log("MongoDB connected");';
if (!updated.includes("startCartRecoveryScheduler();")) {
  if (!updated.includes(connectAnchor)) {
    console.error("ERROR: could not find the MongoDB connected anchor.");
    process.exit(1);
  }
  const withScheduler = updated.replace(
    connectAnchor,
    connectAnchor + "\n\n    startCartRecoveryScheduler();"
  );
  fs.writeFileSync(backendFile, withScheduler, "utf8");
} else {
  fs.writeFileSync(backendFile, updated, "utf8");
}

console.log("PATCHED: abandoned cart recovery added to", backendFile);
