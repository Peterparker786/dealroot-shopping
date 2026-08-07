/* Patch: Dealroot Tryouts program.
 * - tryoutOnly flag on Product (schema + payload + toggle endpoint)
 * - TryoutApplication model
 * - Endpoints: apply, my status, admin list, approve, reject
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

// 1. Product schema: tryoutOnly flag.
replaceOnce(
  "    isFeatured: { type: Boolean, default: false },\n    dealType: {",
  "    isFeatured: { type: Boolean, default: false },\n    tryoutOnly: { type: Boolean, default: false },\n    dealType: {",
  "product schema"
);

// 2. productPayload: persist the flag explicitly.
replaceOnce(
  "    isFeatured: Boolean(body.isFeatured),\n    marketplaceLinks: sanitizeMarketplaceLinks(body.marketplaceLinks),",
  "    isFeatured: Boolean(body.isFeatured),\n    tryoutOnly: Boolean(body.tryoutOnly),\n    marketplaceLinks: sanitizeMarketplaceLinks(body.marketplaceLinks),",
  "product payload"
);

// 3. Admin toggle endpoint after the stock patch.
const stockPatchEnd =
  '    res.json({\n      success: true,\n      message: "Stock updated successfully",\n      product,\n    });\n  } catch {\n    res.status(400).json({\n      success: false,\n      message: "Could not update stock",\n    });\n  }\n});';

replaceOnce(
  stockPatchEnd,
  stockPatchEnd +
    '\n\n// Admin: toggle a product in the Dealroot Tryouts program.\napp.patch("/api/products/:id/tryout", requireAdmin, async (req, res) => {\n  try {\n    const product = await Product.findByIdAndUpdate(\n      req.params.id,\n      { tryoutOnly: Boolean(req.body?.tryoutOnly) },\n      { new: true, runValidators: true }\n    );\n\n    if (!product) {\n      return res.status(404).json({ success: false, message: "Product not found" });\n    }\n\n    res.json({\n      success: true,\n      message: product.tryoutOnly\n        ? "Product added to Dealroot Tryouts" \n        : "Product removed from Dealroot Tryouts",\n      product,\n    });\n  } catch {\n    res.status(400).json({ success: false, message: "Could not update tryout status" });\n  }\n});',
  "tryout toggle endpoint"
);

// 4. Tryout program model + endpoints before startServer.
const anchor = "const startServer = async () => {";

const tryoutsBlock = `// ===================== DEALROOT TRYOUTS =====================
const tryoutApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const TryoutApplication = mongoose.model(
  "TryoutApplication",
  tryoutApplicationSchema
);

// Customer: apply for the Tryout program (one active application at a time).
app.post("/api/tryouts/apply", requireUser, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").replace(/\\D/g, "").slice(0, 10);
    const city = String(req.body?.city || "").trim();
    const reason = String(req.body?.reason || "").trim();

    if (name.length < 2) {
      return res.status(400).json({ success: false, message: "Please enter your full name" });
    }

    const existing = await TryoutApplication.findOne({
      user: req.user.userId,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "approved"
            ? "You are already an approved Tryout member"
            : "Your Tryout application is already under review",
      });
    }

    // Allow re-applying after a rejection.
    if (req.body?.replaceRejected) {
      await TryoutApplication.deleteMany({
        user: req.user.userId,
        status: "rejected",
      });
    }

    const user = await User.findById(req.user.userId).select("email");

    const application = await TryoutApplication.create({
      user: req.user.userId,
      name,
      email: user?.email || "",
      phone,
      city,
      reason,
    });

    res.json({
      success: true,
      message: "Application submitted — we will review it soon",
      application,
    });
  } catch (error) {
    console.error("Tryout apply failed:", error.message);
    res.status(500).json({ success: false, message: "Could not submit your application" });
  }
});

// Customer: my Tryout application / status.
app.get("/api/tryouts/my", requireUser, async (req, res) => {
  try {
    const application = await TryoutApplication.findOne({
      user: req.user.userId,
    }).sort({ requestedAt: -1 });

    res.json({
      success: true,
      application,
      approved: application?.status === "approved",
    });
  } catch {
    res.status(500).json({ success: false, message: "Could not load your application" });
  }
});

// Admin: all Tryout applications.
app.get("/api/tryouts/applications", requireAdmin, async (req, res) => {
  try {
    const applications = await TryoutApplication.find()
      .sort({ requestedAt: -1 })
      .limit(200);
    res.json({ success: true, applications });
  } catch {
    res.status(500).json({ success: false, message: "Could not load applications" });
  }
});

// Admin: approve a Tryout application.
app.post("/api/tryouts/:id/approve", requireAdmin, async (req, res) => {
  try {
    const application = await TryoutApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    if (application.status === "approved") {
      return res.status(400).json({ success: false, message: "Already approved" });
    }

    application.status = "approved";
    application.processedAt = new Date();
    await application.save();

    res.json({ success: true, message: "Application approved — member can now shop Tryout deals", application });
  } catch {
    res.status(500).json({ success: false, message: "Could not approve application" });
  }
});

// Admin: reject a Tryout application.
app.post("/api/tryouts/:id/reject", requireAdmin, async (req, res) => {
  try {
    const application = await TryoutApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    application.status = "rejected";
    application.processedAt = new Date();
    await application.save();

    res.json({ success: true, message: "Application rejected", application });
  } catch {
    res.status(500).json({ success: false, message: "Could not reject application" });
  }
});

const startServer = async () => {`;

if (!src.includes(anchor)) {
  console.error("startServer anchor NOT FOUND");
  process.exit(1);
}
src = src.replace(anchor, tryoutsBlock, 1);

fs.writeFileSync(file, src);
console.log(
  "Tryouts backend patch applied:",
  src.includes("tryoutOnly: { type: Boolean"),
  src.includes("TryoutApplication = mongoose.model"),
  src.includes("/api/tryouts/apply"),
  src.includes("/api/products/:id/tryout")
);
