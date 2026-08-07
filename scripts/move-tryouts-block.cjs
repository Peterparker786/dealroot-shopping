/* Fix: move the Dealroot Tryouts block above flashProducts so
 * tryoutApproved/shopProducts are initialized before they are used.
 * Handles both LF and CRLF files. */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-shopping/src/pages/Home.jsx";
let s = fs.readFileSync(file, "utf8");

const nl = s.includes("\r\n") ? "\r\n" : "\n";
const startMarker = "  // ---------- Dealroot Tryouts ----------";
const endMarker = "  // Deal of the Day countdown";

const startIdx = s.indexOf(startMarker);
const endIdx = s.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  console.error("markers not found:", startIdx, endIdx);
  process.exit(1);
}

const block = s.slice(startIdx, endIdx);
s = s.slice(0, startIdx) + s.slice(endIdx);

const insertAnchor =
  '  const formatTime = (n) => String(n).padStart(2, "0");' + nl + nl;
const insertAt = s.indexOf(insertAnchor);
if (insertAt === -1) {
  console.error("formatTime anchor not found");
  process.exit(1);
}

s = s.slice(0, insertAt + insertAnchor.length) + block + s.slice(insertAt + insertAnchor.length);
fs.writeFileSync(file, s);
console.log("tryouts block moved above flashProducts (line endings: " + (nl === "\r\n" ? "CRLF" : "LF") + ")");
