// Test harness for abandoned cart recovery.
//   setup  → signup a throwaway user, save a cart, backdate lastSeenAt
//   check  → report AbandonedCart status + created recovery coupon
// Reads MONGODB_URI from the backend .env.
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const backendDir = path.resolve(__dirname, "../../dealroot-backend");
const base = "http://localhost:5000";
const mode = process.argv[2] || "setup";

function readEnv(name) {
  const txt = fs.readFileSync(path.join(backendDir, ".env"), "utf8");
  const line = txt
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith(name + "="));
  return line ? line.slice(name.length + 1).trim() : "";
}

async function api(pathName, options = {}) {
  const res = await fetch(base + pathName, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

(async () => {
  const uri = readEnv("MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const userEmail =
    "cartrecovery.test." + Date.now() + "@example.com";

  if (mode === "setup") {
    // 1. Signup a throwaway user
    const signup = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: "Cart Recovery Test",
        email: userEmail,
        password: "TestPass123!",
      }),
    });

    if (!signup.data.token) {
      console.log("SIGNUP FAILED:", signup.status, JSON.stringify(signup.data));
      process.exit(1);
    }
    console.log("Signed up:", userEmail);

    // 2. Save a cart with 2 real products
    const products = await api("/api/products");
    const picks = products.data.products.slice(0, 2);

    const save = await api("/api/cart/save", {
      method: "POST",
      headers: { Authorization: "Bearer " + signup.data.token },
      body: JSON.stringify({
        items: picks.map((p, i) => ({
          productId: p._id,
          quantity: i + 1,
        })),
      }),
    });
    console.log("Cart save:", save.status, save.data.message);

    // 3. Backdate lastSeenAt so the recovery cutoff already passed
    const coll = db.collection("abandonedcarts");
    const rec = await coll.findOne({ email: userEmail });
    if (!rec) {
      console.log("ERROR: AbandonedCart record not found in DB");
      process.exit(1);
    }
    await coll.updateOne(
      { _id: rec._id },
      { $set: { lastSeenAt: new Date(Date.now() - 2 * 3600 * 1000) } }
    );
    console.log("Backdated lastSeenAt → " + rec._id);
    console.log("SETUP DONE — now restart the backend and run: node scripts/test-cart-recovery.cjs check");
  } else if (mode === "check") {
    const coll = db.collection("abandonedcarts");
    const recs = await coll.find().sort({ lastSeenAt: -1 }).limit(3).toArray();

    for (const r of recs) {
      const coupons = r.couponId
        ? await db.collection("coupons").findOne({ _id: r.couponId })
        : null;
      console.log("---");
      console.log("user:", r.email);
      console.log("items:", (r.items || []).length, "| subtotal: ₹" + r.subtotal);
      console.log("status:", r.status, "| emailSentAt:", r.emailSentAt || "—");
      console.log(
        "coupon:",
        coupons ? coupons.code + " (₹" + coupons.discountValue + "% off, min ₹" + coupons.minimumOrder + ")" : "—"
      );
    }

    // Cleanup test data (test users + their carts + coupons)
    const testUsers = await db
      .collection("users")
      .find({ email: /^cartrecovery\.test\./ })
      .toArray();
    if (testUsers.length) {
      const ids = testUsers.map((u) => u._id);
      await db.collection("abandonedcarts").deleteMany({ user: { $in: ids } });
      await db.collection("users").deleteMany({ _id: { $in: ids } });
      console.log("\nCleaned up", testUsers.length, "test user(s) + carts");
    }
    const testCoupons = await db
      .collection("coupons")
      .find({ code: /^CART10-/ })
      .toArray();
    if (testCoupons.length) {
      await db.collection("coupons").deleteMany({ code: /^CART10-/ });
      console.log("Cleaned up", testCoupons.length, "test coupon(s)");
    }
  }

  await client.close();
})().catch((error) => {
  console.error("TEST ERROR:", error.message);
  process.exit(1);
});
