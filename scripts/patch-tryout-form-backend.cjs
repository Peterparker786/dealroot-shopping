// Patch: extend TryoutApplication with state/pincode/previous-program fields,
// notify owner by email on new applications, and add a disqualify endpoint.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "..", "dealroot-backend", "src", "server.js");
let src = fs.readFileSync(file, "utf8");
let count = 0;

function replace(oldStr, newStr) {
  if (!src.includes(oldStr)) {
    console.error("NOT FOUND:\n" + oldStr.slice(0, 200) + "\n---");
    process.exitCode = 1;
    return;
  }
  src = src.split(oldStr).join(newStr);
  count += 1;
}

// 1) Schema: add fields + "disqualified" status.
replace(
  `    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },`,
  `    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    previousProgram: { type: String, trim: true },
    otherProgram: { type: String, trim: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "disqualified"],
      default: "pending",
      index: true,
    },`
);

// 2) Apply endpoint: read + validate new fields.
replace(
  `    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").replace(/\\D/g, "").slice(0, 10);
    const city = String(req.body?.city || "").trim();
    const reason = String(req.body?.reason || "").trim();

    if (name.length < 2) {
      return res.status(400).json({ success: false, message: "Please enter your full name" });
    }`,
  `    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").replace(/\\D/g, "").slice(0, 10);
    const city = String(req.body?.city || "").trim();
    const state = String(req.body?.state || "").trim();
    const pincode = String(req.body?.pincode || "").replace(/\\D/g, "").slice(0, 6);
    const previousProgram = String(req.body?.previousProgram || "").trim();
    const otherProgram = String(req.body?.otherProgram || "").trim();
    const reason = String(req.body?.reason || "").trim();

    if (name.length < 2) {
      return res.status(400).json({ success: false, message: "Please enter your full name" });
    }
    if (phone.length !== 10) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number" });
    }
    if (pincode.length !== 6) {
      return res.status(400).json({ success: false, message: "Please enter a valid 6-digit pincode" });
    }
    if (previousProgram === "Other" && !otherProgram) {
      return res.status(400).json({ success: false, message: "Please tell us the name of the other program" });
    }`
);

// 3) Apply endpoint: store new fields.
replace(
  `    const application = await TryoutApplication.create({
      user: req.user.userId,
      name,
      email: user?.email || "",
      phone,
      city,
      reason,
    });`,
  `    const application = await TryoutApplication.create({
      user: req.user.userId,
      name,
      email: user?.email || "",
      phone,
      city,
      state,
      pincode,
      previousProgram,
      otherProgram,
      reason,
    });

    // Notify the owner about the new application with the full form details.
    if (process.env.ADMIN_EMAIL) {
      const prevLabel =
        previousProgram === "Other"
          ? "Other (" + (otherProgram || "-") + ")"
          : previousProgram || "-";
      transporter
        .sendMail({
          from: '"DEALROOT Beauty" <' + process.env.EMAIL_USER + ">",
          to: process.env.ADMIN_EMAIL,
          subject: "📝 New Tryout application — " + name,
          html:
            '<div style="font-family:Arial;padding:30px;max-width:620px;margin:auto">' +
            '<h2 style="color:#1f2a4d;margin:0 0 6px">New Dealroot Tryouts Application</h2>' +
            '<p style="color:#6b7280;margin:0 0 18px">A customer just applied for the Tryout program. Details below:</p>' +
            '<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">' +
            row("Name", xmlEscape(name)) +
            row("Email", xmlEscape(user?.email || "-")) +
            row("Phone", xmlEscape(phone || "-")) +
            row("City", xmlEscape(city || "-")) +
            row("State", xmlEscape(state || "-")) +
            row("Pincode", xmlEscape(pincode || "-")) +
            row("Tried before", xmlEscape(prevLabel)) +
            row("Reason", xmlEscape(reason || "-")) +
            "</table>" +
            '<p style="margin-top:18px;color:#6b7280;font-size:13px">Review this application from the DealRoot admin panel → Tryouts tab (approve / reject / disqualify).</p>' +
            "</div>",
        })
        .catch((err) => console.error("Tryout owner email failed:", err.message));
    }`
);

// 4) Add the disqualify endpoint right after the reject endpoint.
replace(
  `    res.json({ success: true, message: "Application rejected", application });
  } catch {
    res.status(500).json({ success: false, message: "Could not reject application" });
  }
});`,
  `    res.json({ success: true, message: "Application rejected", application });
  } catch {
    res.status(500).json({ success: false, message: "Could not reject application" });
  }
});

// Admin: disqualify an approved Tryout member (revoke membership).
app.post("/api/tryouts/:id/disqualify", requireAdmin, async (req, res) => {
  try {
    const application = await TryoutApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    if (application.status !== "approved") {
      return res.status(400).json({ success: false, message: "Only approved members can be disqualified" });
    }

    application.status = "disqualified";
    application.processedAt = new Date();
    await application.save();

    res.json({ success: true, message: "Member disqualified — Tryout deals are locked again", application });
  } catch {
    res.status(500).json({ success: false, message: "Could not disqualify member" });
  }
});`
);

fs.writeFileSync(file, src);
console.log("Patched server.js (" + count + " replacements).");
