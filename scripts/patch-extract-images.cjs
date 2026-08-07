/* Patch: make extract-from-link return product images reliably.
 * - Always upload the main image (already downloaded for vision).
 * - Accept smaller images (10KB+) and octet-stream content-type with image ext.
 * - Log upload failures instead of silently swallowing them.
 * - Fall back to the raw CDN image URLs when Cloudinary fails.
 */
const fs = require("fs");

const file = "C:/Users/ST/Desktop/DEALROOT/dealroot-backend/src/server.js";
let src = fs.readFileSync(file, "utf8");

const oldBlock = `      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const mimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";

      const info = await extractProductFromScreenshot(
        imageBuffer,
        mimeType,
        contextText
      );

      // Upload the extracted product photos to Cloudinary so the storefront
      // can use them directly.
      const uploadedImages = [];

      for (const imgUrl of pageImages.slice(0, 5)) {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 20000);

        try {
          const response2 = await fetch(imgUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
            },
            signal: controller2.signal,
          });

          const buffer2 = Buffer.from(await response2.arrayBuffer());
          const type2 = response2.headers.get("content-type") || "";
          const looksLikeImage =
            /^image\\//i.test(type2) ||
            (!type2 && /\\.(jpe?g|png|webp|gif)$/i.test(imgUrl));

          if (buffer2.length > 20000 && looksLikeImage) {
            const secureUrl = await uploadBufferToCloudinary(buffer2);
            if (secureUrl && !uploadedImages.includes(secureUrl)) {
              uploadedImages.push(secureUrl);
            }
          }
        } catch {
          // skip broken images
        } finally {
          clearTimeout(timeout2);
        }
      }

      res.json({
        success: true,
        info,
        images: uploadedImages,
      });`;

const newBlock = `      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const mimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";

      const info = await extractProductFromScreenshot(
        imageBuffer,
        mimeType,
        contextText
      );

      // Upload the extracted product photos to Cloudinary so the storefront
      // can use them directly. The main image is guaranteed to be a real
      // photo (the vision model just used it), so it is always uploaded even
      // when the stricter size/content-type checks would reject it.
      const uploadedImages = [];

      const pushUploaded = (url) => {
        if (url && !uploadedImages.includes(url)) {
          uploadedImages.push(url);
        }
      };

      const looksLikeImageUrl = (type, url) =>
        /^image\\//i.test(type) ||
        (/\\/(jpe?g|png|webp|gif)$/i.test(url) &&
          (type === "" || /^(image\\/|application\\/octet-stream)/i.test(type)));

      if (imageBuffer.length > 5000 && looksLikeImageUrl(mimeType, mainImage)) {
        try {
          pushUploaded(await uploadBufferToCloudinary(imageBuffer));
        } catch (error) {
          console.error(
            "Main image Cloudinary upload failed:",
            error.message
          );
        }
      }

      for (const imgUrl of pageImages.slice(0, 5)) {
        if (imgUrl === mainImage) continue;

        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 20000);

        try {
          const response2 = await fetch(imgUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
            },
            signal: controller2.signal,
          });

          const buffer2 = Buffer.from(await response2.arrayBuffer());
          const type2 = response2.headers.get("content-type") || "";

          if (buffer2.length > 10000 && looksLikeImageUrl(type2, imgUrl)) {
            try {
              const secureUrl = await uploadBufferToCloudinary(buffer2);
              if (secureUrl) pushUploaded(secureUrl);
            } catch (error) {
              console.error(
                "Product image Cloudinary upload failed:",
                error.message
              );
            }
          }
        } catch (error) {
          console.error("Product image download failed:", error.message);
        } finally {
          clearTimeout(timeout2);
        }
      }

      // Fallback: if nothing could be uploaded to Cloudinary (e.g. quota or
      // datacenter IP blocked by the CDN), still hand back the original CDN
      // image URLs so the admin can review and save them.
      const images =
        uploadedImages.length > 0
          ? uploadedImages
          : pageImages.slice(0, 5);

      res.json({
        success: true,
        info,
        images,
      });`;

if (!src.includes(oldBlock)) {
  console.error("OLD BLOCK NOT FOUND — aborting");
  process.exit(1);
}

src = src.replace(oldBlock, newBlock);
fs.writeFileSync(file, src);
console.log("Patch applied. New block count check:", src.includes("const images ="));
