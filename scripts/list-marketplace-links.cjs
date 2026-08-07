require("dotenv").config({ path: "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/.env" });
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const cur = mongoose.connection.db.collection("products").aggregate([
    { $unwind: "$marketplaceLinks" },
    { $match: { "marketplaceLinks.url": { $ne: "" } } },
    { $group: { _id: "$marketplaceLinks.platform", url: { $first: "$marketplaceLinks.url" } } },
  ]);
  const out = [];
  for await (const d of cur) out.push({ platform: d._id, url: d.url });
  console.log(JSON.stringify(out, null, 1));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
