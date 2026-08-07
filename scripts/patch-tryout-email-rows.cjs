// Fix: replace undefined row() helper calls in the tryout owner email with inline rows.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "..", "dealroot-backend", "src", "server.js");
let src = fs.readFileSync(file, "utf8");

const oldBlock = `            row("Name", xmlEscape(name)) +
            row("Email", xmlEscape(user?.email || "-")) +
            row("Phone", xmlEscape(phone || "-")) +
            row("City", xmlEscape(city || "-")) +
            row("State", xmlEscape(state || "-")) +
            row("Pincode", xmlEscape(pincode || "-")) +
            row("Tried before", xmlEscape(prevLabel)) +
            row("Reason", xmlEscape(reason || "-")) +
            "</table>" +`;

const newBlock = `            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold;width:160px">Name</td><td style="padding:8px 10px">' + xmlEscape(name) + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">Email</td><td style="padding:8px 10px">' + xmlEscape(user?.email || "-") + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">Phone</td><td style="padding:8px 10px">' + xmlEscape(phone || "-") + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">City</td><td style="padding:8px 10px">' + xmlEscape(city || "-") + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">State</td><td style="padding:8px 10px">' + xmlEscape(state || "-") + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">Pincode</td><td style="padding:8px 10px">' + xmlEscape(pincode || "-") + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">Tried before</td><td style="padding:8px 10px">' + xmlEscape(prevLabel) + "</td></tr>" +
            '<tr><td style="padding:8px 10px;background:#f4f1ff;font-weight:bold">Reason</td><td style="padding:8px 10px">' + xmlEscape(reason || "-") + "</td></tr>" +
            "</table>" +`;

if (!src.includes(oldBlock)) {
  console.error("Email block NOT FOUND — check the patch state.");
  process.exit(1);
}

src = src.split(oldBlock).join(newBlock);
fs.writeFileSync(file, src);
console.log("Email rows fixed.");
