/* Verify the backend rejects orders for out-of-stock products, then clean up. */
require("dotenv").config({ path: "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/.env" });
const API = "http://localhost:5000";
const PRODUCT_ID = "6a74876d0daf701c2806ee34"; // Cos-IQ Sunprotect, stock = 0

const api = async (path, { method = "GET", token = "", body } = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, body: data };
};

(async () => {
  const email = `oostest${Date.now()}@test.com`;

  // 1) Create a test user
  const signup = await api("/api/auth/signup", {
    method: "POST",
    body: { name: "OOS Test", email, password: "password123" },
  });
  if (!signup.body.token) throw new Error("signup failed: " + JSON.stringify(signup.body).slice(0, 150));
  const token = signup.body.token;
  console.log("✅ test user created");

  // 2) Try to place a COD order for the out-of-stock product
  const order = await api("/api/orders", {
    method: "POST",
    token,
    body: {
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
      customer: {
        name: "OOS Test",
        phone: "9999999999",
        address: "Test Street",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208001",
      },
      paymentMethod: "cod",
    },
  });
  console.log("order attempt -> HTTP", order.status, "|", (order.body.message || order.body.error || "").slice(0, 140));
  console.log(order.status === 400 || order.status === 409 || order.body.error ? "✅ REJECTED as expected" : "⚠️ NOT REJECTED (check)");

  // 3) Cleanup: delete test user + any order created
  const db = require("mongoose");
  await db.connect(process.env.MONGODB_URI);
  await db.connection.db.collection("users").deleteOne({ email });
  await db.connection.db.collection("orders").deleteMany({ "customer.email": email });
  await db.disconnect();
  console.log("🧹 test user cleaned up");
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
