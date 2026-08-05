// Injects Cloudinary responsive transforms (width + auto quality/format) into a
// Cloudinary image URL so browsers download far smaller files. Non-Cloudinary
// URLs are returned untouched.
export function optimizeImage(url, width = 600) {
  if (!url || typeof url !== "string") return url;

  const match = url.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.*)$/
  );

  if (!match) return url;

  return `${match[1]}w_${width},q_auto,f_auto/${match[2]}`;
}
