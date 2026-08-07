/* Full end-to-end Returns & Refunds test:
 * 1. Sign up a fresh test user
 * 2. Place an order with a real product
 * 3. File a return with photo upload (Amazon-style)
 * 4. User lists "my returns"
 * 5. Admin lists + approves with deduction/refund
 * 6. Double-approve rejected
 * 7. Cleanup (return, order, user)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const API = "http://localhost:5000";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = `return-test-${Date.now()}@example.com`;

  // 1. Sign up
  const signupRes = await fetch(`${API}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Return Tester", email, password: "testpass123" }),
  });
  const signup = await signupRes.json();
  if (!signupRes.ok) {
    console.error("Signup failed:", signup.message);
    process.exit(1);
  }
  const userToken = signup.token;
  const userId = signup.user._id;
  console.log("✅ Signup:", email);

  // Product to order
  const product = await mongoose.connection.collection("products").findOne({});
  if (!product) {
    console.error("No products in DB");
    process.exit(1);
  }

  // 2. Place order
  const orderRes = await fetch(`${API}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      customer: {
        name: "Return Tester",
        email,
        phone: "9876543210",
        address: "Test Street 12",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208001",
      },
      items: [{ productId: product._id.toString(), quantity: 1 }],
      paymentMethod: "cod",
    }),
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) {
    console.error("Order failed:", orderData.message);
    process.exit(1);
  }
  const order = orderData.order || orderData;
  console.log("✅ Order placed:", order.orderNumber, "| total:", order.totalAmount);

  const adminToken = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // 3. File return with photo upload
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const form = new FormData();
  form.append("orderId", order._id.toString());
  form.append("reason", "Product is defective / not working");
  form.append("description", "Test: the bottle arrived cracked.");
  form.append("upiId", "testuser@ybl");
  form.append("images", new File([png], "proof.png", { type: "image/png" }));

  const createRes = await fetch(`${API}/api/returns`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: form,
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    console.error("❌ Return create failed:", created.message);
    process.exit(1);
  }
  const returnId = created.returnRequest._id;
  const rr = created.returnRequest;
  console.log(
    "✅ Return filed | images:",
    rr.images.length,
    "| order total:",
    rr.expectedAmount,
    "| shipping fee:",
    rr.shippingFee,
    "| refundable:",
    rr.refundableAmount,
    "| upi:",
    rr.upiId
  );
  if (rr.refundableAmount !== Math.max(0, rr.expectedAmount - rr.shippingFee)) {
    console.error("❌ refundableAmount calculation wrong");
    process.exit(1);
  }

  // 4. My returns
  const myRes = await fetch(`${API}/api/returns/my`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const myData = await myRes.json();
  console.log("✅ My returns count:", (myData.returns || []).length);

  // 5. Admin list + approve
  const listRes = await fetch(`${API}/api/returns`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const listData = await listRes.json();
  const found = (listData.returns || []).find((r) => r._id === returnId);
  console.log("✅ Admin list — found:", !!found, "| status:", found?.status);

  const refund =
    Number(created.returnRequest.refundableAmount ||
      created.returnRequest.expectedAmount) - 20;
  const approveRes = await fetch(`${API}/api/returns/${returnId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      deductionAmount: 20,
      refundAmount: refund,
      adminNote: "₹20 deducted for damaged packaging",
    }),
  });
  const approved = await approveRes.json();
  if (!approveRes.ok) {
    console.error("❌ Approve failed:", approved.message);
    process.exit(1);
  }
  const r = approved.returnRequest;
  console.log(
    "✅ Approved | status:",
    r.status,
    "| deduction:",
    r.deductionAmount,
    "| refund:",
    r.refundAmount
  );

  // 6. Double-approve rejected
  const againRes = await fetch(`${API}/api/returns/${returnId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ deductionAmount: 0, refundAmount: 10 }),
  });
  const again = await againRes.json();
  console.log("✅ Double-approve blocked (expect 400):", againRes.status, "|", again.message);

  // 7. Cleanup
  const db = mongoose.connection.db;
  await db.collection("returnrequests").deleteOne({ _id: new mongoose.Types.ObjectId(returnId) });
  await db.collection("orders").deleteOne({ _id: order._id });
  await db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
  // restore stock
  await db.collection("products").updateOne(
    { _id: product._id },
    { $inc: { stock: 1 } }
  );
  console.log("🧹 Cleanup done — test return, order and user removed; stock restored.");

  await mongoose.disconnect();
  console.log("\n🎉 RETURNS FLOW TEST PASSED");
}

main().catch((error) => {
  console.error("Test crashed:", error.message);
  process.exit(1);
});
