/* Patch: recover FirstCry's full image gallery during extract-from-link.
 *
 * FirstCry renders its gallery via JavaScript, so the raw HTML only has the
 * og:image. Its CDN stores every gallery shot as
 *   https://cdn.fcglcdn.com/brainbees/images/products/zoom/{slug}-{productId}{letter}.jpg
 * where {letter} runs a, b, c, ... We probe those URLs (cheap Range request)
 * and merge the ones that exist into the image list.
 */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// 1) Insert the helper right after extractProductImagesFromHtml
const helperAnchor = `    .filter((f, index, array) => array.findIndex((x) => x.url === f.url) === index)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10)
    .map((f) => f.url);
};

app.post(
  "/api/products/extract-info",`;

const helper = `    .filter((f, index, array) => array.findIndex((x) => x.url === f.url) === index)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10)
    .map((f) => f.url);
};

// FirstCry renders its product gallery via JavaScript, so the raw HTML only
// contains the og:image. Its CDN stores every gallery shot as
//   https://cdn.fcglcdn.com/brainbees/images/products/zoom/{slug}-{productId}{letter}.jpg
// where {letter} runs a, b, c, ... Probe those URLs (cheap Range requests) and
// return the ones that actually exist.
const extractFirstCryGalleryImages = async (html, baseUrl) => {
  const ogMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
  );
  const ogUrl = ogMatch?.[1];

  if (!ogUrl || !/cdn\\.fcglcdn\\.com\\/[^"']*\\/products\\/zoom\\//i.test(ogUrl)) {
    return [];
  }

  let base;
  try {
    const parsed = new URL(ogUrl, baseUrl);
    const filename = parsed.pathname.split("/").pop() || "";
    // "...-1560634zzsq.jpg" -> strip the size marker + extension
    const stripped = filename.replace(
      /(?:zzsq|zz|zoom)?\\.(?:jpe?g|png|webp)$/i,
      ""
    );
    base =
      parsed.origin +
      parsed.pathname.slice(0, parsed.pathname.length - filename.length) +
      stripped;
  } catch {
    return [];
  }

  const found = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    for (const letter of "abcdefghij".split("")) {
      const url = base + letter + ".jpg";
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA, Range: "bytes=0-1023" },
          signal: controller.signal,
        });
        if (!res.ok) break; // gallery letters are contiguous — stop at first miss
        const type = res.headers.get("content-type") || "";
        if (!/^image\\//i.test(type)) break;
        found.push(url);
      } catch {
        break;
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return found;
};

app.post(
  "/api/products/extract-info",`;

if (!src.includes(helperAnchor)) {
  console.error("HELPER ANCHOR NOT FOUND — aborting");
  process.exit(1);
}
src = src.replace(helperAnchor, helper);

// 2) Merge gallery images into pageImages in the extract-from-link route
const pageAnchor = `      const pageImages = extractProductImagesFromHtml(html, url);`;

const pageNew = `      const pageImages = [
        ...new Set([
          ...extractProductImagesFromHtml(html, url),
          ...(await extractFirstCryGalleryImages(html, url)),
        ]),
      ];`;

if (!src.includes(pageAnchor)) {
  console.error("PAGE IMAGES ANCHOR NOT FOUND — aborting");
  process.exit(1);
}
src = src.replace(pageAnchor, pageNew);

fs.writeFileSync(file, src);
console.log("FirstCry gallery patch applied:", src.includes("extractFirstCryGalleryImages"));
