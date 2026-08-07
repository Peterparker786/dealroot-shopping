/* Patch: enforce Tryout membership at order placement.
 * Orders containing a tryoutOnly product are rejected unless the user has
 * an approved TryoutApplication.
 */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

const oldStr =
  '        if (!product) {\n' +
  '          throw new Error(\n' +
  '            "A product is unavailable or does not have enough stock"\n' +
  "          );\n" +
  "        }\n" +
  "\n" +
  "        const lineTotal = product.price * quantity;";

const newStr =
  '        if (!product) {\n' +
  '          throw new Error(\n' +
  '            "A product is unavailable or does not have enough stock"\n' +
  "          );\n" +
  "        }\n" +
  "\n" +
  "        if (product.tryoutOnly) {\n" +
  "          const tryoutMember = await TryoutApplication.findOne({\n" +
  "            user: req.user.userId,\n" +
  '            status: "approved",\n' +
  "          });\n" +
  "          if (!tryoutMember) {\n" +
  '            throw new Error(\n' +
  '              "This product is exclusive to approved Tryout members. Kindly apply for the Tryout program first."\n' +
  "            );\n" +
  "          }\n" +
  "        }\n" +
  "\n" +
  "        const lineTotal = product.price * quantity;";

if (!src.includes(oldStr)) {
  console.error("ANCHOR NOT FOUND — aborting");
  process.exit(1);
}

src = src.replace(oldStr, newStr, 1);
fs.writeFileSync(file, src);
console.log("Tryout order guard applied:", src.includes("This product is exclusive to approved Tryout members"));
