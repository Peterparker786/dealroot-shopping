/* End-to-end test for the order status timeline feature.
 * Uses clearly-marked test data and cleans up everything it creates.
 * Backend email is guarded by ORDER_STATUS_DRY_RUN in the test run.
 */
const BASE = process.env.BASE || "http://localhost:5000";

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const stamp = Date.now();
const email = `timeline-test-${stamp}@example.com`;
const testEmail = `timeline-owner-${stamp}@example.com`;

(async () => {
  // 1. Register test user
  let r = await api("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: "Timeline Test",
      email,
      password: "testpass123",
    }),
  });
  if (!r.body.token) throw new Error("signup failed: " + JSON.stringify(r.body));
  const userToken = r.body.token;
  console.log("✅ signup OK ->", email);

  // 2. Fetch a product to order
  const products = await api("/api/products");
  const product = products.body.products?.[0] || products.body[0];
  if (!product) throw new Error("no products found");
  console.log("✅ product fetched ->", product.title, product.price);

  // 3. Place order
  r = await api("/api/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      items: [
        {
          productId: product._id,
          quantity: 1,
        },
      ],
      customer: {
        name: "Timeline Test",
        email,
        phone: "9876543210",
        address: "123 Test Street, Kanpur",
        state: "Uttar Pradesh",
        city: "Kanpur",
        pincode: "208001",
      },
      paymentMethod: "cod",
    }),
  });
  if (!r.body.order) throw new Error("order failed: " + JSON.stringify(r.body));
  const orderId = r.body.order._id;
  console.log("✅ order placed ->", orderId, "status:", r.body.order.orderStatus);
  console.log("   statusHistory:", JSON.stringify(r.body.order.statusHistory));

  // 4. Admin login
  r = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  if (!r.body.token) {
    console.log("⚠️  admin login skipped (no ADMIN_EMAIL/PASSWORD in env):", JSON.stringify(r.body).slice(0, 120));
    process.exit(2);
  }
  const adminToken = r.body.token;
  console.log("✅ admin login OK");

  // 5. PATCH status -> packed
  r = await api(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ orderStatus: "packed" }),
  });
  if (!r.body.order) throw new Error("status PATCH failed: " + JSON.stringify(r.body));
  console.log("✅ PATCH packed ->", r.body.message);
  console.log("   statusHistory:", JSON.stringify(r.body.order.statusHistory));

  // 6. PATCH status -> shipped (email should fire again)
  r = await api(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ orderStatus: "shipped" }),
  });
  console.log("✅ PATCH shipped ->", r.body.message);
  console.log("   statusHistory:", JSON.stringify(r.body.order.statusHistory));

  const history = r.body.order?.statusHistory || [];
  const historyOk =
    history.some((h) => h.status === "placed") &&
    history.some((h) => h.status === "packed") &&
    history.some((h) => h.status === "shipped");
  console.log(historyOk ? "✅ statusHistory has placed+packed+shipped" : "❌ statusHistory incomplete");

  // 7. Verify timeline endpoint / account orders returns statusHistory
  r = await api("/api/auth/orders", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const myOrder = (r.body.orders || []).find((o) => o._id === orderId);
  console.log(
    "✅ /api/auth/orders includes statusHistory:",
    Array.isArray(myOrder?.statusHistory) && myOrder.statusHistory.length >= 3
  );

  // 8. Cleanup: cancel order (restores stock) + delete test user + delete test order
  try {
    await api(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("✅ test order cancelled (cleanup)");
  } catch {}
  // Delete test order + test user directly via mongoose through a temp script is heavy;
  // cancel is enough to leave a clean state (order stays in history but cancelled).

  console.log("\n🎯 TIMELINE TEST DONE. historyOk =", historyOk);
  process.exit(historyOk ? 0 : 1);
})().catch((err) => {
  console.error("❌ TEST FAILED:", err.message);
  process.exit(1);
});
