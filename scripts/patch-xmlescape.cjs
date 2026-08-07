/* Patch: define the missing xmlEscape helper used by HTML email templates. */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

const anchor = 'const { v2: cloudinary } = require("cloudinary");\n\nconst app = express();';

const helper =
  'const { v2: cloudinary } = require("cloudinary");\n' +
  "\n" +
  "// Escapes user-provided text before it is placed inside HTML emails.\n" +
  "const xmlEscape = (value) =>\n" +
  '  String(value ?? "")\n' +
  '    .replace(/&/g, "&amp;")\n' +
  '    .replace(/</g, "&lt;")\n' +
  '    .replace(/>/g, "&gt;")\n' +
  '    .replace(/"/g, "&quot;")\n' +
  "    .replace(/'/g, \"&#39;\");\n" +
  "\n" +
  "const app = express();";

if (!src.includes(anchor)) {
  console.error("ANCHOR NOT FOUND — aborting");
  process.exit(1);
}

src = src.replace(anchor, helper);
fs.writeFileSync(file, src);
console.log("xmlEscape helper defined:", src.includes("const xmlEscape ="));
