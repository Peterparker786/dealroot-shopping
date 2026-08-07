/* Patch: full Returns / Refunds system (Amazon-style).
 * - ReturnRequest model
 * - Cloudinary upload for return images + video
 * - Emails: applied (customer + admin), approved (with deduction/refund), rejected
 * - Endpoints: customer create + list, admin list + approve + reject
 */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

const anchor = `const startServer = async () => {`;

const returnsBlock = `// ===================== RETURNS & REFUNDS =====================
const RETURN_REASONS = [
  "Product is defective / not working",
  "Item arrived damaged or broken",
  "Wrong item was delivered",
  "Product quality not as expected",
  "Missing parts / accessories",
  "Change of mind (no longer needed)",
];

const returnRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    reason: { type: String, required: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    video: { type: String, default: "" },
    upiId: { type: String, default: "" },
    expectedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    deductionAmount: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    adminNote: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);

// Upload a return file (image or video) to Cloudinary without the 800x800
// image crop used for product photos.
const uploadReturnFile = (buffer, isVideo) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dealroot-returns",
        resource_type: isVideo ? "video" : "image",
        ...(isVideo
          ? {}
          : { transformation: [{ quality: "auto", fetch_format: "auto" }] }),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

async function sendRefundAppliedEmail(returnRequest, order, customerEmail) {
  if (process.env.ORDER_STATUS_EMAIL_DRY_RUN === "true") {
    console.log("[dry-run] Refund applied email → " + order.orderNumber);
    return;
  }

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;">\\n' +
    '  <div style="background:#e21c48;padding:22px 28px;text-align:center;">\\n' +
    '    <h1 style="color:#fff;margin:0;font-size:20px;">DEALROOT BEAUTY</h1>\\n' +
    '    <p style="color:#ffe4e9;margin:6px 0 0;font-size:13px;">Return / Refund request received</p>\\n' +
    "  </div>\\n" +
    '  <div style="padding:28px;">\\n' +
    '    <p style="font-size:14px;color:#333;">Hi ' +
    xmlEscape(order.customer?.name || "there") +
    ",</p>\\n" +
    '    <p style="font-size:14px;color:#555;line-height:1.6;">We have received your return request for order <strong>' +
    order.orderNumber +
    "</strong>. Our team will review it within 1-2 business days.</p>\\n" +
    '    <div style="background:#fff5f7;border:1px solid #ffd6de;border-radius:10px;padding:16px 20px;margin:18px 0;">\\n' +
    '      <h3 style="margin:0 0 10px;font-size:15px;color:#e21c48;">Return summary</h3>\\n' +
    '      <table style="width:100%;font-size:13px;color:#444;border-collapse:collapse;">\\n' +
    "        <tr><td style='padding:4px 0;'>Order number</td><td style='text-align:right;font-weight:700;'>" +
    order.orderNumber +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Return reason</td><td style='text-align:right;'>" +
    xmlEscape(returnRequest.reason) +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Expected refund</td><td style='text-align:right;font-weight:700;'>₹" +
    Number(returnRequest.expectedAmount || 0).toFixed(2) +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Refund method</td><td style='text-align:right;'>UPI" +
    (returnRequest.upiId ? " (" + xmlEscape(returnRequest.upiId) + ")" : "") +
    "</td></tr>\\n" +
    "      </table>\\n" +
    "    </div>\\n" +
    '    <p style="font-size:13px;color:#777;line-height:1.6;">Once your request is approved, you will receive a confirmation email with the exact deduction (if any) and the final amount to be refunded.</p>\\n' +
    '    <a href="' +
    seoSiteUrl +
    '/account" style="display:block;text-align:center;background:#e21c48;color:#fff;text-decoration:none;padding:14px;border-radius:999px;font-size:14px;font-weight:700;">Track my return</a>\\n' +
    '    <p style="font-size:12px;color:#999;margin-top:20px;line-height:1.6;text-align:center;">Questions? Reach us at dealroot.store@gmail.com or @Tom_andrew72 on Telegram.</p>\\n' +
    "  </div>\\n" +
    "</div>";

  await transporter.sendMail({
    from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
    to: customerEmail,
    subject: "🔄 Return request received — " + order.orderNumber,
    html,
  });
}

async function sendRefundApprovedEmail(returnRequest, order, customerEmail) {
  if (process.env.ORDER_STATUS_EMAIL_DRY_RUN === "true") {
    console.log("[dry-run] Refund approved email → " + order.orderNumber);
    return;
  }

  const refund = Number(returnRequest.refundAmount || 0);
  const deduction = Number(returnRequest.deductionAmount || 0);
  const expected = Number(returnRequest.expectedAmount || 0);

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;">\\n' +
    '  <div style="background:#12805c;padding:22px 28px;text-align:center;">\\n' +
    '    <h1 style="color:#fff;margin:0;font-size:20px;">DEALROOT BEAUTY</h1>\\n' +
    '    <p style="color:#d8f5e9;margin:6px 0 0;font-size:13px;">Refund request has been accepted ✅</p>\\n' +
    "  </div>\\n" +
    '  <div style="padding:28px;">\\n' +
    '    <p style="font-size:14px;color:#333;">Hi ' +
    xmlEscape(order.customer?.name || "there") +
    ",</p>\\n" +
    '    <p style="font-size:14px;color:#555;line-height:1.6;">Good news! Your return request for order <strong>' +
    order.orderNumber +
    ' has been accepted.</strong> The refund will be processed to your UPI account within 3-5 business days.</p>\\n' +
    '    <div style="background:#eefaf5;border:1px solid #b9e6d2;border-radius:10px;padding:16px 20px;margin:18px 0;">\\n' +
    '      <h3 style="margin:0 0 10px;font-size:15px;color:#12805c;">Refund details</h3>\\n' +
    '      <table style="width:100%;font-size:13px;color:#444;border-collapse:collapse;">\\n' +
    "        <tr><td style='padding:4px 0;'>Order number</td><td style='text-align:right;font-weight:700;'>" +
    order.orderNumber +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Return reason</td><td style='text-align:right;'>" +
    xmlEscape(returnRequest.reason) +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Expected refund</td><td style='text-align:right;'>₹" +
    expected.toFixed(2) +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Deductions</td><td style='text-align:right;color:#c0392b;'>- ₹" +
    deduction.toFixed(2) +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Amount to be refunded</td><td style='text-align:right;font-size:16px;font-weight:800;color:#12805c;'>₹" +
    refund.toFixed(2) +
    "</td></tr>\\n" +
    "        <tr><td style='padding:4px 0;'>Refund method</td><td style='text-align:right;'>UPI" +
    (returnRequest.upiId ? " (" + xmlEscape(returnRequest.upiId) + ")" : "") +
    "</td></tr>\\n" +
    (returnRequest.adminNote
      ? "        <tr><td style='padding:4px 0;'>Note</td><td style='text-align:right;'>" +
        xmlEscape(returnRequest.adminNote) +
        "</td></tr>\\n"
      : "") +
    "      </table>\\n" +
    "    </div>\\n" +
    '    <p style="font-size:13px;color:#777;line-height:1.6;">If you have any questions about this refund, just reply to this email or reach us on Telegram at @Tom_andrew72.</p>\\n' +
    '    <a href="' +
    seoSiteUrl +
    '/account" style="display:block;text-align:center;background:#12805c;color:#fff;text-decoration:none;padding:14px;border-radius:999px;font-size:14px;font-weight:700;">Track my return</a>\\n' +
    "  </div>\\n" +
    "</div>";

  await transporter.sendMail({
    from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
    to: customerEmail,
    subject: "✅ Refund request has been accepted — " + order.orderNumber,
    html,
  });
}

async function sendRefundRejectedEmail(returnRequest, order, customerEmail) {
  if (process.env.ORDER_STATUS_EMAIL_DRY_RUN === "true") {
    console.log("[dry-run] Refund rejected email → " + order.orderNumber);
    return;
  }

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;">\\n' +
    '  <div style="background:#c0392b;padding:22px 28px;text-align:center;">\\n' +
    '    <h1 style="color:#fff;margin:0;font-size:20px;">DEALROOT BEAUTY</h1>\\n' +
    '    <p style="color:#fbdcd7;margin:6px 0 0;font-size:13px;">Return request update</p>\\n' +
    "  </div>\\n" +
    '  <div style="padding:28px;">\\n' +
    '    <p style="font-size:14px;color:#333;">Hi ' +
    xmlEscape(order.customer?.name || "there") +
    ",</p>\\n" +
    '    <p style="font-size:14px;color:#555;line-height:1.6;">We are sorry, but your return request for order <strong>' +
    order.orderNumber +
    " could not be approved.</p>\\n" +
    '    <div style="background:#fdf0ee;border:1px solid #f2c4bd;border-radius:10px;padding:16px 20px;margin:18px 0;">\\n' +
    '      <h3 style="margin:0 0 10px;font-size:15px;color:#c0392b;">Why?</h3>\\n' +
    '      <p style="font-size:13px;color:#555;line-height:1.6;margin:0;">' +
    xmlEscape(returnRequest.rejectionReason || "Your request did not qualify for a return.") +
    "</p>\\n" +
    "    </div>\\n" +
    '    <p style="font-size:13px;color:#777;line-height:1.6;">If you believe this is a mistake, please contact us at dealroot.store@gmail.com or @Tom_andrew72 on Telegram and we will look into it.</p>\\n' +
    "  </div>\\n" +
    "</div>";

  await transporter.sendMail({
    from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
    to: customerEmail,
    subject: "❌ Return request update — " + order.orderNumber,
    html,
  });
}

// Customer: file a return/refund request (within 7 days, with photos/video + UPI).
app.post(
  "/api/returns",
  requireUser,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const orderId = String(req.body?.orderId || "").trim();
      const reason = String(req.body?.reason || "").trim();
      const description = String(req.body?.description || "").trim();
      const upiId = String(req.body?.upiId || "").trim();

      if (!orderId) {
        return res.status(400).json({ success: false, message: "Order is required" });
      }
      if (!reason || !RETURN_REASONS.includes(reason)) {
        return res.status(400).json({ success: false, message: "Please choose a valid return reason" });
      }

      const order = await Order.findOne({ _id: orderId, user: req.user.userId });
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      if (order.orderStatus === "cancelled") {
        return res.status(400).json({ success: false, message: "Cancelled orders cannot be returned" });
      }

      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const placedAt = new Date(order.createdAt || Date.now()).getTime();
      if (Date.now() - placedAt > sevenDays) {
        return res.status(400).json({
          success: false,
          message: "The 7-day return window has expired. Please contact support.",
        });
      }

      const existing = await ReturnRequest.findOne({
        order: order._id,
        status: { $in: ["pending", "approved"] },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "A return request already exists for this order.",
        });
      }

      // Upload return photos + video to Cloudinary.
      const images = [];
      const files = req.files || {};
      for (const file of files.images || []) {
        try {
          const url = await uploadReturnFile(file.buffer, false);
          if (url) images.push(url);
        } catch (error) {
          console.error("Return image upload failed:", error.message);
        }
      }

      let video = "";
      const videoFile = (files.video || [])[0];
      if (videoFile) {
        try {
          video = await uploadReturnFile(videoFile.buffer, true);
        } catch (error) {
          console.error("Return video upload failed:", error.message);
        }
      }

      const user = await User.findById(req.user.userId);
      const customerEmail =
        String(order.customer?.email || "").trim() || user?.email || "";

      const returnRequest = await ReturnRequest.create({
        user: req.user.userId,
        order: order._id,
        orderNumber: order.orderNumber,
        items: (order.items || []).map((item) => ({
          product: item.product,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        reason,
        description,
        images,
        video,
        upiId,
        expectedAmount: Number(order.totalAmount || 0),
      });

      // Emails: customer confirmation + owner notification.
      if (customerEmail) {
        sendRefundAppliedEmail(returnRequest, order, customerEmail).catch((e) =>
          console.error("Refund applied email failed:", e.message)
        );
      }
      if (process.env.ADMIN_EMAIL) {
        transporter
          .sendMail({
            from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
            to: process.env.ADMIN_EMAIL,
            subject: "🔄 New return request — " + order.orderNumber,
            html:
              '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;"><h2 style="color:#e21c48;">New return request</h2>' +
              '<p>Order: <b>' +
              order.orderNumber +
              "</b></p><p>Reason: " +
              xmlEscape(reason) +
              "</p><p>Description: " +
              xmlEscape(description || "-") +
              "</p><p>Expected refund: ₹" +
              Number(order.totalAmount || 0).toFixed(2) +
              "</p><p>UPI: " +
              xmlEscape(upiId || "-") +
              '</p><p>Photos: ' +
              (images.length ? images.map((u) => '<a href="' + u + '">view</a>').join(" | ") : "none") +
              (video ? ' | <a href="' + video + '">video</a>' : "") +
              '</p><p>Review it in the admin panel: <a href="' +
              seoSiteUrl +
              '/#admin">DealRoot Admin</a></p></div>',
          })
          .catch((e) => console.error("Owner return email failed:", e.message));
      }

      res.json({
        success: true,
        message: "Return request submitted. We will review it within 1-2 days.",
        returnRequest,
      });
    } catch (error) {
      console.error("Return request failed:", error.message);
      res.status(500).json({ success: false, message: error.message || "Could not submit return request" });
    }
  }
);

// Customer: my return requests.
app.get("/api/returns/my", requireUser, async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ user: req.user.userId })
      .sort({ requestedAt: -1 })
      .limit(20);
    res.json({ success: true, returns });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load returns" });
  }
});

// Admin: all return requests.
app.get("/api/returns", requireAdmin, async (req, res) => {
  try {
    const returns = await ReturnRequest.find()
      .sort({ requestedAt: -1 })
      .limit(100)
      .populate("order", "orderNumber totalAmount customer");
    res.json({ success: true, returns });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load returns" });
  }
});

// Admin: approve a return with deduction + final refund amount.
app.post("/api/returns/:id/approve", requireAdmin, async (req, res) => {
  try {
    const deductionAmount = Math.max(0, Number(req.body?.deductionAmount) || 0);
    const refundAmount = Math.max(0, Number(req.body?.refundAmount) || 0);
    const adminNote = String(req.body?.adminNote || "").trim();

    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }
    if (returnRequest.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request was already processed" });
    }
    if (refundAmount <= 0) {
      return res.status(400).json({ success: false, message: "Refund amount must be greater than 0" });
    }

    returnRequest.status = "approved";
    returnRequest.deductionAmount = deductionAmount;
    returnRequest.refundAmount = refundAmount;
    returnRequest.adminNote = adminNote;
    returnRequest.processedAt = new Date();
    await returnRequest.save();

    const order = await Order.findById(returnRequest.order);
    const customerEmail =
      String(order?.customer?.email || "").trim() ||
      (returnRequest.user
        ? (await User.findById(returnRequest.user).select("email"))?.email
        : "") ||
      "";

    if (customerEmail) {
      sendRefundApprovedEmail(returnRequest, order, customerEmail).catch((e) =>
        console.error("Refund approved email failed:", e.message)
      );
    }

    res.json({
      success: true,
      message: "Return approved — refund email sent to the customer.",
      returnRequest,
    });
  } catch (error) {
    console.error("Approve return failed:", error.message);
    res.status(500).json({ success: false, message: "Could not approve return" });
  }
});

// Admin: reject a return.
app.post("/api/returns/:id/reject", requireAdmin, async (req, res) => {
  try {
    const rejectionReason = String(req.body?.rejectionReason || "").trim();
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: "Please add a rejection reason" });
    }

    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }
    if (returnRequest.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request was already processed" });
    }

    returnRequest.status = "rejected";
    returnRequest.rejectionReason = rejectionReason;
    returnRequest.processedAt = new Date();
    await returnRequest.save();

    const order = await Order.findById(returnRequest.order);
    const customerEmail =
      String(order?.customer?.email || "").trim() ||
      (returnRequest.user
        ? (await User.findById(returnRequest.user).select("email"))?.email
        : "") ||
      "";

    if (customerEmail) {
      sendRefundRejectedEmail(returnRequest, order, customerEmail).catch((e) =>
        console.error("Refund rejected email failed:", e.message)
      );
    }

    res.json({
      success: true,
      message: "Return rejected — the customer has been notified.",
      returnRequest,
    });
  } catch (error) {
    console.error("Reject return failed:", error.message);
    res.status(500).json({ success: false, message: "Could not reject return" });
  }
});

const startServer = async () => {`;

if (!src.includes(anchor)) {
  console.error("ANCHOR NOT FOUND — aborting");
  process.exit(1);
}

src = src.replace(anchor, returnsBlock);
fs.writeFileSync(file, src);
console.log("Returns system patch applied:", src.includes("ReturnRequest"));
