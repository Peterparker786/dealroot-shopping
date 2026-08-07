/* Patch: give a clear message when Cloudinary is not configured on the server
 * instead of Cloudinary's raw "must supply api_key" error. */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

const oldBlock = `  "/api/upload",
  requireAdmin,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images selected",
        });
      }`;

const newBlock = `  "/api/upload",
  requireAdmin,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Cloudinary is not configured on this server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the server environment (Render dashboard > Environment), then restart.",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images selected",
        });
      }`;

if (!src.includes(oldBlock)) {
  console.error("OLD BLOCK NOT FOUND — aborting");
  process.exit(1);
}

src = src.replace(oldBlock, newBlock);
fs.writeFileSync(file, src);
console.log("Upload guard patch applied:", src.includes("Cloudinary is not configured"));
