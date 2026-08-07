// One-off patch: add SEO routes (/sitemap.xml, /robots.txt) to the backend.
// Kept in dealroot-shopping/scripts because the backend repo is outside this
// project's editing workspace.
const fs = require("fs");
const path = require("path");

const backendFile = path.resolve(
  __dirname,
  "../../dealroot-backend/src/server.js"
);

const oldBlock = 'app.get("/api/health", (req, res) => {\n  res.json({\n    success: true,\n    service: "dealroot-backend",\n    database:\n      mongoose.connection.readyState === 1 ? "connected" : "not connected",\n  });\n});';

const newRoutes = `
// ===========================
// SEO — sitemap.xml + robots.txt
// ===========================
// Canonical STOREFRONT domain (the sitemap lists frontend URLs, not this API).
// Keep in sync with SITE_URL in dealroot-shopping/src/seo/seoConfig.js.
const seoSiteUrl = "https://www.dealroot.store";

app.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({})
      .select("title updatedAt")
      .sort({ updatedAt: -1 });

    const staticPages = [
      { path: "/", priority: "1.0", freq: "daily" },
      { path: "/about", priority: "0.6", freq: "monthly" },
      { path: "/brands", priority: "0.6", freq: "monthly" },
      { path: "/contact", priority: "0.5", freq: "monthly" },
      { path: "/become-a-seller", priority: "0.5", freq: "monthly" },
      { path: "/privacy", priority: "0.3", freq: "yearly" },
      { path: "/terms", priority: "0.3", freq: "yearly" },
      { path: "/shipping", priority: "0.4", freq: "yearly" },
      { path: "/refund", priority: "0.4", freq: "yearly" },
    ];

    const pageUrl = function (pagePath) {
      return seoSiteUrl + (pagePath === "/" ? "" : pagePath);
    };

    const urlBlocks = [];

    staticPages.forEach(function (page) {
      urlBlocks.push(
        "  <url>\\n" +
          "    <loc>" + pageUrl(page.path) + "</loc>\\n" +
          "    <changefreq>" + page.freq + "</changefreq>\\n" +
          "    <priority>" + page.priority + "</priority>\\n" +
          "  </url>"
      );
    });

    products.forEach(function (product) {
      const lastmod = product.updatedAt
        ? product.updatedAt.toISOString().slice(0, 10)
        : "";
      let block =
        "  <url>\\n" +
        "    <loc>" + seoSiteUrl + "/product/" + product._id + "</loc>\\n";
      if (lastmod) {
        block += "    <lastmod>" + lastmod + "</lastmod>\\n";
      }
      block +=
        "    <changefreq>weekly</changefreq>\\n" +
        "    <priority>0.8</priority>\\n" +
        "  </url>";
      urlBlocks.push(block);
    });

    const urls = urlBlocks.join("\\n");

    res.set("Content-Type", "application/xml");
    res.send(
      '<?xml version="1.0" encoding="UTF-8"?>\\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
        urls +
        "\\n</urlset>"
    );
  } catch (error) {
    console.error("Sitemap generation failed:", error.message);
    res.status(500).send("Could not generate sitemap");
  }
});

app.get("/robots.txt", function (req, res) {
  res.set("Content-Type", "text/plain");
  res.send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "",
      "Sitemap: " + seoSiteUrl + "/sitemap.xml",
      "Sitemap: https://dealroot-backend.onrender.com/sitemap.xml",
      "",
    ].join("\\n")
  );
});`;

const source = fs.readFileSync(backendFile, "utf8");

if (source.includes('app.get("/sitemap.xml"')) {
  console.log("ALREADY PATCHED — sitemap routes already present. Exiting.");
  process.exit(0);
}

if (!source.includes(oldBlock)) {
  console.error("ERROR: could not find the /api/health block to anchor on.");
  process.exit(1);
}

const updated = source.replace(oldBlock, oldBlock + newRoutes);

fs.writeFileSync(backendFile, updated, "utf8");
console.log("PATCHED: added /sitemap.xml and /robots.txt routes to", backendFile);
