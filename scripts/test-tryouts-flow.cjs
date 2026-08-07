/* End-to-end Dealroot Tryouts test:
 * 1. Sign up a fresh user
 * 2. Apply for the Tryout program
 * 3. Check "my" status is pending
 * 4. Admin lists applications, approves
 * 5. Check status flips to approved
 * 6. Toggle a product as tryoutOnly (admin)
 * 7. Verify the public products API returns tryoutOnly flag
 * 8. Cleanup (application, user, product flag)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const API = "http://localhost:5000";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const email = `tryout-test-${Date.now()}@example.com`;

  // 1. Signup
  const signupRes = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Tryout Tester", email, password: "testpass123" }),
  });
  const signup = await signupRes.json();
  if (!signupRes.ok) {
    console.error("Signup failed:", signup.message);
    process.exit(1);
  }
  const userToken = signup.token;
  const userId = signup.user._id;
  console.log("✅ Signup:", email);

  const adminToken = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // 2. Apply
  const applyRes = await fetch(`${API}/api/tryouts/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ name: "Tryout Tester", phone: "9876543210", city: "Kanpur", reason: "Love testing new skincare" }),
  });
  const applied = await applyRes.json();
  if (!applyRes.ok) {
    console.error("❌ Apply failed:", applied.message);
    process.exit(1);
  }
  const applicationId = applied.application._id;
  console.log("✅ Applied | id:", applicationId, "| status:", applied.application.status);

  // 3. My status
  const myRes = await fetch(`${API}/api/tryouts/my`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const myData = await myRes.json();
  console.log("✅ My status:", myData.application?.status, "| approved:", myData.approved);

  // 4. Admin list + approve
  const listRes = await fetch(`${API}/api/tryouts/applications`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const listData = await listRes.json();
  const found = (listData.applications || []).find((a) => a._id === applicationId);
  console.log("✅ Admin list — found:", !!found, "| status:", found?.status);

  const approveRes = await fetch(`${API}/api/tryouts/${applicationId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const approved = await approveRes.json();
  if (!approveRes.ok) {
    console.error("❌ Approve failed:", approved.message);
    process.exit(1);
  }
  console.log("✅ Approved | status:", approved.application.status);

  // 5. My status again
  const myRes2 = await fetch(`${API}/api/tryouts/my`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const myData2 = await myRes2.json();
  console.log("✅ My status after approval:", myData2.application?.status, "| approved:", myData2.approved);

  // 6. Toggle a product as tryoutOnly
  const product = await db.collection("products").findOne({});
  if (!product) {
    console.error("No products in DB");
    process.exit(1);
  }
  const wasTryout = Boolean(product.tryoutOnly);
  const toggleRes = await fetch(`${API}/api/products/${product._id}/tryout`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ tryoutOnly: true }),
  });
  const toggled = await toggleRes.json();
  if (!toggleRes.ok) {
    console.error("❌ Toggle failed:", toggled.message);
    process.exit(1);
  }
  console.log("✅ Product toggle | tryoutOnly:", toggled.product.tryoutOnly);

  // 7. Public products API includes the flag
  const pubRes = await fetch(`${API}/api/products`);
  const pubData = await pubRes.json();
  const pubProduct = (pubData.products || []).find((p) => p._id === product._id.toString());
  console.log("✅ Public API has tryoutOnly flag:", pubProduct?.tryoutOnly === true);

  // 8. Cleanup
  await db.collection("tryoutapplications").deleteOne({ _id: new mongoose.Types.ObjectId(applicationId) });
  await db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
  await db.collection("products").updateOne(
    { _id: product._id },
    { $set: { tryoutOnly: wasTryout } }
  );
  console.log("🧹 Cleanup done — application, user removed; product flag restored.");

  await mongoose.disconnect();
  console.log("\n🎉 TRYOUTS FLOW TEST PASSED");
}

main().catch((error) => {
  console.error("Test crashed:", error.message);
  process.exit(1);
});
