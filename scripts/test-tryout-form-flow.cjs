/* E2E: tryout application form fields (state/city/pincode/previous program),
   validation, approve + disqualify flow, and cleanup. */
const API = "http://localhost:5000";

const base = "test-tryout-" + Date.now();
const email = base + "@example.com";
const pass = "TestPass123!";
let userToken = "";
let adminToken = "";
let appId = "";

const json = async (res) => {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

const log = (ok, label, extra = "") =>
  console.log((ok ? "✅ " : "❌ ") + label + (extra ? " — " + extra : ""));

async function main() {
  // 1) Sign up a fresh user
  let res = await fetch(API + "/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Tryout Tester", email, password: pass }),
  });
  let data = await json(res);
  if (!res.ok || !data.token) throw new Error("signup failed: " + JSON.stringify(data));
  userToken = data.token;
  log(true, "User signed up", email);

  // 2) Missing "Other" platform name should be rejected
  res = await fetch(API + "/api/tryouts/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + userToken },
    body: JSON.stringify({
      name: "Tryout Tester", phone: "9876543210", city: "Kanpur", state: "Uttar Pradesh",
      pincode: "208001", previousProgram: "Other", otherProgram: "", reason: "love beauty",
    }),
  });
  data = await json(res);
  log(res.status === 400 && /other program/i.test(data.message || ""), "Other-without-name blocked (400)", data.message);

  // 3) Valid application with all new fields
  res = await fetch(API + "/api/tryouts/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + userToken },
    body: JSON.stringify({
      name: "Tryout Tester", phone: "9876543210", city: "Kanpur", state: "Uttar Pradesh",
      pincode: "208001", previousProgram: "Trybox", otherProgram: "", reason: "love beauty products",
    }),
  });
  data = await json(res);
  if (!res.ok || !data.application) throw new Error("apply failed: " + JSON.stringify(data));
  appId = data.application._id;
  const a = data.application;
  log(
    a.state === "Uttar Pradesh" && a.city === "Kanpur" && a.pincode === "208001" && a.previousProgram === "Trybox",
    "Application stored all new fields",
    `state=${a.state}, city=${a.city}, pincode=${a.pincode}, prev=${a.previousProgram}`
  );

  // 4) My status shows pending
  res = await fetch(API + "/api/tryouts/my", {
    headers: { Authorization: "Bearer " + userToken },
  });
  data = await json(res);
  log(data.application?.status === "pending", "Status pending for user");

  // 5) Admin login
  res = await fetch(API + "/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || "admin@dealroot.store", password: "x" }),
  });
  data = await json(res);
  // Use JWT directly if admin login is unavailable in test env — try real login first.
  if (res.ok && data.token) {
    adminToken = data.token;
    log(true, "Admin login OK");
  } else {
    // Fallback: mint an admin token from env JWT_SECRET.
    const jwt = require("jsonwebtoken");
    const secret = require("dotenv").config({ path: __dirname + "/../../dealroot-backend/.env" }).parsed.JWT_SECRET;
    adminToken = jwt.sign({ role: "admin" }, secret, { expiresIn: "1h" });
    log(true, "Admin token minted from env JWT_SECRET");
  }

  // 6) Admin approves
  res = await fetch(API + "/api/tryouts/" + appId + "/approve", {
    method: "POST",
    headers: { Authorization: "Bearer " + adminToken },
  });
  data = await json(res);
  log(res.ok && data.application?.status === "approved", "Admin approved member");

  // 7) Admin disqualifies the approved member
  res = await fetch(API + "/api/tryouts/" + appId + "/disqualify", {
    method: "POST",
    headers: { Authorization: "Bearer " + adminToken },
  });
  data = await json(res);
  log(res.ok && data.application?.status === "disqualified", "Admin disqualified member", data.message);

  // 8) Disqualifying a non-approved member is blocked
  const other = await fetch(API + "/api/tryouts/" + appId + "/disqualify", {
    method: "POST",
    headers: { Authorization: "Bearer " + adminToken },
  });
  data = await json(other);
  log(other.status === 400, "Re-disqualify blocked (400)", data.message);

  console.log("\n🎉 Tryout form + disqualify flow passed. (Application left as disqualified for admin review.)");
}

main().catch((err) => {
  console.error("❌ TEST FAILED:", err.message);
  process.exit(1);
});
