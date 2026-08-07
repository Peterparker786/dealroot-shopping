/* Test the Tryout order guard:
 * 1. Signup user, mark a product tryoutOnly
 * 2. Order with tryout product as non-approved user → expect 400
 * 3. Apply + approve → order again → expect success
 * 4. Cleanup
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const API = "http://localhost:5000";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const email = `tryout-guard-${Date.now()}@example.com`;

  const signupRes = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Guard Tester", email, password: "testpass123" }),
  });
  const signup = await signupRes.json();
  const userToken = signup.token;
  const userId = signup.user._id;
  console.log("✅ Signup:", email);

  const adminToken = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Mark a product tryoutOnly (remember original)
  const product = await db.collection("products").findOne({});
  const wasTryout = Boolean(product.tryoutOnly);
  await db.collection("products").updateOne({ _id: product._id }, { $set: { tryoutOnly: true } });
  console.log("✅ Marked product tryoutOnly:", product.title);

  const orderBody = {
    customer: { name: "Guard Tester", email, phone: "9876543210", address: "Test 1", city: "Kanpur", state: "Uttar Pradesh", pincode: "208001" },
    items: [{ productId: product._id.toString(), quantity: 1 }],
    paymentMethod: "cod",
  };

  // 2. Non-approved order → must fail
  const blockedRes = await fetch(`${API}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
    body: JSON.stringify(orderBody),
  });
  const blocked = await blockedRes.json();
  console.log("❌ Blocked for non-approved (expect 400):", blockedRes.status, "|", blocked.message);
  if (blockedRes.status !== 400) {
    console.error("❌ GUARD NOT WORKING — non-approved user could order");
    process.exit(1);
  }

  // 3. Apply + approve
  const applyRes = await fetch(`${API}/api/tryouts/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ name: "Guard Tester", city: "Kanpur" }),
  });
  const applied = await applyRes.json();
  const appId = applied.application._id;
  await fetch(`${API}/api/tryouts/${appId}/approve`, { method: "POST", headers: { Authorization: `Bearer ${adminToken}` } });
  console.log("✅ Applied + approved");

  // 4. Approved order → must succeed
  const okRes = await fetch(`${API}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
    body: JSON.stringify(orderBody),
  });
  const okData = await okRes.json();
  console.log("✅ Order allowed after approval:", okRes.status, "|", okData.order?.orderNumber || okData.message);
  if (!okRes.ok) {
    console.error("❌ Approved order failed:", okData.message);
    process.exit(1);
  }

  // 5. Cleanup
  await db.collection("orders").deleteOne({ orderNumber: okData.order?.orderNumber });
  await db.collection("tryoutapplications").deleteOne({ _id: new mongoose.Types.ObjectId(appId) });
  await db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
  await db.collection("products").updateOne({ _id: product._id }, { $set: { tryoutOnly: wasTryout } });
  console.log("🧹 Cleanup done");

  await mongoose.disconnect();
  console.log("\n🎉 TRYOUT ORDER GUARD TEST PASSED");
}

main().catch((error) => {
  console.error("Test crashed:", error.message);
  process.exit(1);
});
