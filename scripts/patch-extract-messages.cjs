/* Patch: clearer errors when a store blocks automated access (403/429) or the
 * page is client-side rendered (empty HTML), pointing the admin to the
 * screenshot method instead. */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

// 1) Better message for 403/429 (bot protection) and empty pages
const oldOk = `      if (!pageResponse.ok) {
        throw new Error(
          \`Product page khul nahi paayi (status \${pageResponse.status}). Link check karein.\`
        );
      }

      const html = (await pageResponse.text()).slice(0, 3000000);`;

const newOk = `      if (!pageResponse.ok) {
        const blocked =
          pageResponse.status === 403 || pageResponse.status === 429;
        throw new Error(
          blocked
            ? \`Is store ne automated access block kar diya hai (status \${pageResponse.status}). Is platform ke liye screenshot method use karein.\`
            : \`Product page khul nahi paayi (status \${pageResponse.status}). Link check karein.\`
        );
      }

      const html = (await pageResponse.text()).slice(0, 3000000);

      if (html.trim().length < 2000) {
        throw new Error(
          "Ye page bot-protected ya client-side rendered hai (khali response aaya). Is platform ke liye screenshot method use karein."
        );
      }`;

// 2) Better message when no images could be pulled from the page
const oldNoImg = `      if (pageImages.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Is link se product image nahi mili — screenshot option use karein",
        });
      }`;

const newNoImg = `      if (pageImages.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Is link se product image nahi mili (ye platform images JS se load karta hai). Is product ke liye screenshot option use karein.",
        });
      }`;

let applied = 0;
if (src.includes(oldOk)) {
  src = src.replace(oldOk, newOk);
  applied++;
} else {
  console.error("BLOCK 1 NOT FOUND");
}
if (src.includes(oldNoImg)) {
  src = src.replace(oldNoImg, newNoImg);
  applied++;
} else {
  console.error("BLOCK 2 NOT FOUND");
}

fs.writeFileSync(file, src);
console.log("Patched blocks:", applied, "/ 2");
