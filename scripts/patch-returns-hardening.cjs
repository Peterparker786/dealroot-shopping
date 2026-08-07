/* Hardening patch for the Returns system:
 * 1. Dedicated multer instance (25MB) for return photos/video.
 * 2. Approve endpoint caps refundAmount at expectedAmount - deduction.
 */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

// 1. Dedicated multer for return uploads (video can be large).
const uploadAnchor = "const PORT = process.env.PORT || 5000;";
const uploadNew =
  "const PORT = process.env.PORT || 5000;\n" +
  "\n" +
  "// Returns uploads allow larger videos (photos + one video).\n" +
  "const returnUpload = multer({\n" +
  "  storage: multer.memoryStorage(),\n" +
  "  limits: {\n" +
  "    fileSize: 25 * 1024 * 1024, // 25MB\n" +
  "    files: 6, // up to 5 photos + 1 video\n" +
  "  },\n" +
  "});";

if (!src.includes(uploadAnchor)) {
  console.error("Upload anchor NOT FOUND");
  process.exit(1);
}
src = src.replace(uploadAnchor, uploadNew, 1);

// 2. Use the dedicated instance in the returns route.
const routeOld = "  upload.fields([\n    { name: \"images\", maxCount: 5 },\n    { name: \"video\", maxCount: 1 },\n  ]),";
const routeNew = "  returnUpload.fields([\n    { name: \"images\", maxCount: 5 },\n    { name: \"video\", maxCount: 1 },\n  ]),";
if (!src.includes(routeOld)) {
  console.error("Returns route anchor NOT FOUND");
  process.exit(1);
}
src = src.replace(routeOld, routeNew, 1);

// 3. Cap refund amount in the approve endpoint.
const capOld =
  '    if (refundAmount <= 0) {\n      return res.status(400).json({ success: false, message: "Refund amount must be greater than 0" });\n    }';
const capNew =
  '    if (refundAmount <= 0) {\n      return res.status(400).json({ success: false, message: "Refund amount must be greater than 0" });\n    }\n' +
  "    if (refundAmount > Number(returnRequest.expectedAmount || 0) - deductionAmount) {\n" +
  "      return res.status(400).json({\n" +
  "        success: false,\n" +
  '        message: "Refund amount cannot exceed the expected refund minus the deduction",\n' +
  "      });\n" +
  "    }";
if (!src.includes(capOld)) {
  console.error("Cap anchor NOT FOUND");
  process.exit(1);
}
src = src.replace(capOld, capNew, 1);

fs.writeFileSync(file, src);
console.log(
  "Hardening applied:",
  src.includes("const returnUpload"),
  src.includes("returnUpload.fields"),
  src.includes("cannot exceed the expected refund")
);
