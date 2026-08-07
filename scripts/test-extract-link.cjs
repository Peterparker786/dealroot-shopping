/* Diagnostic for "extract from link" returning no images.
 * Mints an admin token from the backend .env JWT secret and calls the real
 * endpoint, then diagnoses each image download/upload step directly.
 */
require("dotenv").config({ path: "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/.env" });
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

const API = "http://localhost:5000";
const link = process.argv[2] || "https://amzn.in/d/01U6SdPQ";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "dealroot-products", transformation: [{ width: 800, height: 800, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" }] },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });

(async () => {
  // 1) Mint admin token
  const token = jwt.sign({ role: "admin", email: process.env.ADMIN_EMAIL }, process.env.JWT_SECRET, { expiresIn: "8h" });

  // 2) Call the real endpoint
  console.log("=== CALLING /api/products/extract-from-link ===");
  const start = Date.now();
  const res = await fetch(`${API}/api/products/extract-from-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url: link }),
  });
  const data = await res.json();
  console.log("HTTP", res.status, "in", ((Date.now() - start) / 1000).toFixed(1) + "s");
  console.log("success:", data.success);
  console.log("images returned:", (data.images || []).length);
  console.log("info.title:", data.info?.title ? data.info.title.slice(0, 60) : "(none)");
  console.log("info specs:", (data.info?.specifications || []).length, "highlights:", (data.info?.highlights || []).length);
  if (data.message) console.log("message:", data.message);
  console.log("images list:", JSON.stringify(data.images || []).slice(0, 300));
  if (data.images && data.images.length > 0) {
    console.log("✅ ENDPOINT RETURNED IMAGES");
    process.exit(0);
  }

  // 3) Raw diagnosis — reproduce the backend image pipeline
  console.log("\n=== RAW DIAGNOSIS ===");
  const pageResponse = await fetch(link, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    },
    redirect: "follow",
  });
  console.log("page status:", pageResponse.status, "final url:", pageResponse.url.slice(0, 80));
  const html = (await pageResponse.text()).slice(0, 3000000);

  // find og:image + generic amazon images
  const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const amazon = [...new Set([...(html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+\-_.]+\.(?:jpg|jpeg|webp|png)/g) || [])])].slice(0, 5);
  console.log("og:image:", og);
  console.log("amazon imgs found in HTML:", amazon.length);

  const candidates = [...new Set([og, ...amazon].filter(Boolean))].slice(0, 3);
  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" },
      });
      const buf = Buffer.from(await r.arrayBuffer());
      const type = r.headers.get("content-type") || "";
      console.log(`\nimg: ${url.slice(0, 90)}`);
      console.log("  status:", r.status, "| content-type:", type, "| size:", buf.length, "bytes");
      const looksLikeImage = /^image\//i.test(type) || (!type && /\.(jpe?g|png|webp|gif)$/i.test(url));
      console.log("  looksLikeImage:", looksLikeImage, "| >20KB:", buf.length > 20000);
      if (buf.length > 20000 && looksLikeImage) {
        try {
          const secure = await uploadBuffer(buf);
          console.log("  ✅ uploaded:", secure.slice(0, 80));
        } catch (e) {
          console.log("  ❌ cloudinary upload failed:", e.message.slice(0, 120));
        }
      }
    } catch (e) {
      console.log(`\nimg fetch error: ${url.slice(0, 80)} -> ${e.message.slice(0, 100)}`);
    }
  }
  process.exit(0);
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
