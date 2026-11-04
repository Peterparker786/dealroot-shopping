import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiExternalLink,
  FiLink,
  FiRefreshCw,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";
import { optimizeImage } from "../utils/cloudinary";

// Marketplace choices for the source link. Kept in one place so the dropdown,
// the badge and the backend enum always agree.
const PLATFORMS = ["Amazon", "Flipkart", "Meesho", "DigiHaat"];

// Mirrors the backend's own URL -> platform mapping so the dropdown picks the
// same marketplace the scraper will actually use for this link.
const platformForUrl = (url) => {
  let host = "";

  try {
    host = new URL(String(url).trim()).hostname.toLowerCase();
  } catch {
    return "";
  }

  if (host.includes("amazon")) return "Amazon";
  if (host.includes("flipkart")) return "Flipkart";
  if (host.includes("meesho")) return "Meesho";
  if (host.includes("digihaat") || host.includes("digihat")) return "DigiHaat";
  return "";
};

const round2 = (amount) => Math.round((Number(amount) + Number.EPSILON) * 100) / 100;

const emptyForm = {
  title: "",
  brand: "",
  category: "",
  platform: "Amazon",
  sourceUrl: "",
  stock: "20",
  mrp: "",
  rating: "4.5",
  reviews: "0",
  description: "",
  specifications: [],
  highlights: [],
  images: [],
};

// "Dropship Product Add" — same form structure and extractors as the regular
// "Add product" form, plus a source link, an auto-detected platform and a
// margin rule. On submit the backend fetches the live source price, applies
// the margin and creates an ordinary catalog product (plus its dropship
// metadata with `isDropship: true`).
function DropshipProductTab({ apiUrl, token, request, showToast, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [marginType, setMarginType] = useState("percentage");
  const [marginValue, setMarginValue] = useState("100");
  // Live price read from the source link by "Extract from link".
  const [sourcePrice, setSourcePrice] = useState(0);
  const [sourceInStock, setSourceInStock] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  // id of the row currently re-checking its source price (per-row Sync button).
  const [syncingId, setSyncingId] = useState("");
  const [lastResult, setLastResult] = useState(null);

  // Extractors — identical states/markup to the regular Products form.
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [extractingInfo, setExtractingInfo] = useState(false);
  const [extractingLink, setExtractingLink] = useState(false);
  const [extractPreview, setExtractPreview] = useState(null);
  const [previewDraft, setPreviewDraft] = useState(null);

  // Default to the store's first category once the category list arrives.
  useEffect(() => {
    setForm((current) =>
      current.category || !categories?.length
        ? current
        : { ...current, category: categories[0].name }
    );
  }, [categories]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await request(`${apiUrl}/api/admin/dropship-products`);
      setEntries(data.dropshipProducts || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
    // `request` is recreated by the parent on every render, so it is not a
    // dependency — the token it closes over is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, token]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Typing/pasting a source link selects its marketplace automatically, so the
  // dropdown never has to be changed by hand. A manual pick still wins until
  // the link is edited again.
  const update = ({ target }) => {
    const { name, value } = target;

    setForm((current) => {
      if (name === "sourceUrl") {
        const detected = platformForUrl(value);
        return {
          ...current,
          sourceUrl: value,
          ...(detected ? { platform: detected } : {}),
        };
      }

      return { ...current, [name]: value };
    });
  };

  const detectedPlatform = platformForUrl(form.sourceUrl);

  // Selling price preview — the backend recalculates this from the live source
  // price on every sync, using the very same rule.
  const computedSellingPrice = useMemo(() => {
    const base = Number(sourcePrice) || 0;
    const margin = Number(marginValue);

    if (base <= 0 || !Number.isFinite(margin) || margin < 0) return 0;

    return round2(
      marginType === "flat" ? base + margin : base + (base * margin) / 100
    );
  }, [sourcePrice, marginType, marginValue]);

  const uploadImages = async (files) => {
    if (!files?.length) return;

    try {
      setUploading(true);

      const formData = new FormData();
      [...files].forEach((file) => formData.append("images", file));

      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setForm((current) => ({
        ...current,
        images: [...current.images, ...data.images],
      }));
      showToast("Images uploaded successfully");
    } catch (error) {
      showToast(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  };

  // Cover image = index 0, exactly like the regular product form.
  const setAsFront = (index) => {
    if (index <= 0) return;

    setForm((current) => {
      if (index >= current.images.length) return current;

      const images = [...current.images];
      const [picked] = images.splice(index, 1);
      images.unshift(picked);
      return { ...current, images };
    });

    showToast("Set as front image — this image will be shown on the storefront");
  };

  // Category isn't a field the extractor returns — match the store's own
  // category list against the extracted text instead, so the dropdown lands on
  // the most likely category.
  const guessCategory = (info) => {
    const haystack = [
      info?.title,
      info?.description,
      info?.brand,
      ...(info?.specifications || []).map(
        (spec) => `${spec?.label || ""} ${spec?.value || ""}`
      ),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack) return "";

    const match = (categories || []).find((category) =>
      String(category.label || category.name)
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= 4)
        .some((word) => haystack.includes(word))
    );

    return match?.name || "";
  };

  // Merge an extract result (info + images) into the form.
  const applyExtractedInfo = (info, images) => {
    setForm((current) => ({
      ...current,
      category: guessCategory(info) || current.category,
      brand: info.brand || current.brand,
      title: info.title || current.title,
      description: info.description || current.description,
      specifications:
        Array.isArray(info.specifications) && info.specifications.length > 0
          ? info.specifications
          : current.specifications,
      highlights:
        Array.isArray(info.highlights) && info.highlights.length > 0
          ? info.highlights
          : current.highlights,
      images:
        Array.isArray(images) && images.length > 0
          ? [...current.images, ...images.filter((img) => !current.images.includes(img))]
          : current.images,
    }));

    if (Number(info.price) > 0) {
      setSourcePrice(Number(info.price));
    }
  };

  const buildPreviewDraft = (info) => ({
    ...info,
    specifications: (info?.specifications || []).map((spec) => ({
      label: spec?.label || "",
      value: spec?.value || "",
    })),
    highlights: [...(info?.highlights || [])],
  });

  // AI screenshot extraction — same endpoint and preview flow as the regular
  // Products form.
  const extractFromScreenshot = async () => {
    if (!screenshotFile) {
      showToast("Please choose a product screenshot first");
      return;
    }

    try {
      setExtractingInfo(true);

      const formData = new FormData();
      formData.append("image", screenshotFile);

      const response = await fetch(`${apiUrl}/api/products/extract-info`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not extract product info");
      }

      const info = data.info || {};
      const specCount = (info.specifications || []).length;
      const highlightCount = (info.highlights || []).length;

      setScreenshotFile(null);

      if (specCount === 0 && highlightCount === 0 && !info.title) {
        showToast(
          "⚠️ No product info found in the screenshot — try a clear, close-up screenshot"
        );
        return;
      }

      setExtractPreview({
        info,
        images: data.images || [],
        source: "screenshot",
      });
      setPreviewDraft(buildPreviewDraft(info));

      showToast("✨ Extracted — review the preview below and press Save");
    } catch (error) {
      showToast(error.message);
    } finally {
      setExtractingInfo(false);
    }
  };

  // Link extraction — the dropship endpoint returns the extracted details AND
  // the parsed live source price used for the margin preview.
  const extractFromLink = async () => {
    const url = form.sourceUrl.trim();

    if (!url) {
      showToast("Please paste a product link first");
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      showToast("Please paste a valid link (https://...)");
      return;
    }

    if (!platformForUrl(url)) {
      showToast("Sirf Amazon / Flipkart / Meesho / DigiHaat link support hota hai");
      return;
    }

    try {
      setExtractingLink(true);

      const response = await fetch(
        `${apiUrl}/api/admin/dropship-products/extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not extract from link");
      }

      const info = data.info || {};

      if (data.platform) {
        setForm((current) => ({ ...current, platform: data.platform }));
      }

      if (Number(data.sourcePrice) > 0) setSourcePrice(Number(data.sourcePrice));
      setSourceInStock(data.inStock !== false);

      setExtractPreview({
        info,
        images: data.images || [],
        source: "link",
      });
      setPreviewDraft(buildPreviewDraft(info));

      showToast(
        `✨ Got ${(info.specifications || []).length} specs + ${
          (info.highlights || []).length
        } points + ${(data.images || []).length} images` +
          (Number(data.sourcePrice) > 0
            ? ` · source ₹${data.sourcePrice}`
            : " · price na mila, save par dobara try hoga")
      );
    } catch (error) {
      showToast(error.message);
    } finally {
      setExtractingLink(false);
    }
  };

  // Specifications editor helpers (same as the regular form).
  const addSpecRow = () => {
    setForm((current) => ({
      ...current,
      specifications: [...(current.specifications || []), { label: "", value: "" }],
    }));
  };

  const updateSpecRow = (index, key, value) => {
    setForm((current) => {
      const specs = [...(current.specifications || [])];
      specs[index] = { ...specs[index], [key]: value };
      return { ...current, specifications: specs };
    });
  };

  const removeSpecRow = (index) => {
    setForm((current) => ({
      ...current,
      specifications: (current.specifications || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      showToast("Product title is required");
      return;
    }

    if (!/^https?:\/\//i.test(form.sourceUrl.trim())) {
      showToast("Valid source product URL daalein (https://...)");
      return;
    }

    const margin = Number(marginValue);

    if (!Number.isFinite(margin) || margin < 0) {
      showToast("Margin 0 ya usse zyada hona chahiye");
      return;
    }

    if (marginType === "percentage" && margin > 1000) {
      showToast("Percentage margin 1000% se zyada nahi ho sakta");
      return;
    }

    if (marginType === "flat" && margin > 100000) {
      showToast("Flat margin ₹1,00,000 se zyada nahi ho sakta");
      return;
    }

    try {
      setSaving(true);
      setLastResult(null);

      const data = await request(`${apiUrl}/api/admin/dropship-products`, {
        method: "POST",
        timeoutMs: 90000,
        body: JSON.stringify({
          ...form,
          marginType,
          marginValue: margin,
          stock: Number(form.stock) || 20,
          mrp: form.mrp === "" ? undefined : Number(form.mrp),
          rating: Number(form.rating) || 0,
          reviews: Number(form.reviews) || 0,
          multiplier: undefined,
        }),
      });

      setSourcePrice(Number(data.dropship?.sourcePrice) || sourcePrice);
      setLastResult({
        title: data.product?.title || form.title,
        sourcePrice: data.dropship?.sourcePrice || 0,
        sellingPrice: data.dropship?.sellingPrice || data.product?.price || 0,
        marginType,
        marginValue: margin,
        inStock: data.dropship?.inStock !== false,
      });

      showToast(data.message || "Dropship product added");

      setForm((current) => ({
        ...emptyForm,
        category: current.category,
      }));
      setSourceInStock(null);

      loadEntries();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    try {
      setSyncing(true);
      const data = await request(
        `${apiUrl}/api/admin/dropship-products/sync`,
        { method: "POST", timeoutMs: 120000 }
      );
      showToast(data.message || "Sync complete");
      loadEntries();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSyncing(false);
    }
  };

  // Per-row Sync: re-fetches just this product's live source price and stock.
  const syncEntry = async (entry) => {
    try {
      setSyncingId(entry._id);
      const data = await request(
        `${apiUrl}/api/admin/dropship-products/${entry._id}/sync`,
        // A live marketplace fetch can take ~30-75s server-side; the default
        // 12s admin timeout would report a false failure.
        { method: "POST", timeoutMs: 90000 }
      );
      showToast(data.message || "Sync complete");
      loadEntries();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSyncingId("");
    }
  };

  const removeEntry = async (entry) => {
    const confirmed = window.confirm(
      `Delete "${entry.title}"? Its catalog product will also be removed.`
    );

    if (!confirmed) return;

    try {
      const data = await request(
        `${apiUrl}/api/admin/dropship-products/${entry._id}`,
        { method: "DELETE" }
      );
      showToast(data.message || "Dropship product deleted");
      loadEntries();
    } catch (error) {
      showToast(error.message);
    }
  };

  const marginLabel = (entry) =>
    entry?.marginType === "flat"
      ? `+₹${Number(entry.marginValue) || 0} flat`
      : `${Number(entry?.marginValue ?? (entry?.multiplier - 1) * 100) || 0}%`;

  return (
    <div className="admin-tab-page dropship-tab">
      <section className="admin-tab-head">
        <div>
          <p>DROPSHIP CATALOG</p>
          <h2>Add a dropship product</h2>
        </div>

        <div className="admin-tab-head-actions">
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={syncNow}
            disabled={syncing}
          >
            <FiRefreshCw /> {syncing ? "Syncing..." : "Sync all prices"}
          </button>
        </div>
      </section>

      <section className="admin-form-card admin-product-form-card">
        <div className="admin-section-title">
          <div>
            <p>NEW DROPSHIP PRODUCT</p>
            <h2>Add a product from Amazon / Flipkart / Meesho / DigiHaat</h2>
          </div>
        </div>

        <form className="product-form" onSubmit={submit}>
          {[
            ["brand", "Brand", "text"],
            ["title", "Product title *", "text"],
            ["stock", "Stock (jab source par available ho) *", "number"],
            ["mrp", "MRP (₹) — blank chhodein to selling price hi MRP hoga", "number"],
            ["rating", "Rating", "number"],
            ["reviews", "Number of reviews", "number"],
          ].map(([name, label, type]) => (
            <label key={name}>
              {label}
              <input
                name={name}
                type={type}
                min={type === "number" ? "0" : undefined}
                step={name === "rating" ? "0.1" : undefined}
                value={form[name]}
                onChange={update}
                required={["title", "stock"].includes(name)}
              />
            </label>
          ))}

          <label>
            Category *
            <select name="category" value={form.category} onChange={update}>
              {(categories || []).map((category) => (
                <option key={category.name} value={category.name}>
                  {category.label || category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Platform *{" "}
            <small>(link se auto-detect)</small>
            <select name="platform" value={form.platform} onChange={update}>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            {detectedPlatform === form.platform && (
              <small className="dropship-detected">Link se auto-detect hua</small>
            )}
          </label>

          <label className="full-field">
            Source product URL *
            <input
              name="sourceUrl"
              type="url"
              value={form.sourceUrl}
              onChange={update}
              placeholder="https://www.amazon.in/dp/... / flipkart / meesho / digihaat"
              required
            />
            {detectedPlatform && (
              <small className="dropship-detected">
                {detectedPlatform} product link detected — platform khud select ho
                gaya.
              </small>
            )}
            <small>
              Isi link se live price aur stock fetch hoga — har 4 ghante
              automatically sync hota rahega. Neeche "Extract from link" dabakar
              title, specs, bullet points aur images bhi bhar sakte hain.
            </small>
          </label>

          {/* ================= DYNAMIC MARGIN CONTROL ================= */}
          <div className="full-field margin-control">
            <span className="specs-editor-title">Margin / Selling price rule</span>
            <small className="specs-editor-hint">
              Selling price har sync par isi rule se calculate hota hai — fixed 2x
              nahi.
            </small>

            <div className="margin-toggle">
              <label>
                <input
                  type="radio"
                  name="marginType"
                  value="percentage"
                  checked={marginType === "percentage"}
                  onChange={() => setMarginType("percentage")}
                />
                Percentage margin (%)
              </label>
              <label>
                <input
                  type="radio"
                  name="marginType"
                  value="flat"
                  checked={marginType === "flat"}
                  onChange={() => setMarginType("flat")}
                />
                Flat margin (₹)
              </label>
            </div>

            <div className="margin-fields">
              <label>
                {marginType === "flat" ? "Extra amount (₹)" : "Margin (%)"}
                <input
                  type="number"
                  min="0"
                  step={marginType === "flat" ? "1" : "0.5"}
                  value={marginValue}
                  onChange={(event) => setMarginValue(event.target.value)}
                />
                <small>
                  {marginType === "flat"
                    ? "Selling price = source price + flat margin"
                    : "100% = 2x, 50% = 1.5x — selling price = source + (source × margin ÷ 100)"}
                </small>
              </label>

              <div className="margin-preview">
                <span>Source price</span>
                <b>{sourcePrice > 0 ? `₹${sourcePrice}` : "—"}</b>
              </div>

              <div className="margin-preview is-selling">
                <span>Selling price</span>
                <b>
                  {computedSellingPrice > 0 ? `₹${computedSellingPrice}` : "—"}
                </b>
              </div>
            </div>

            <small className="margin-hint">
              {sourcePrice > 0
                ? `₹${sourcePrice} ${
                    marginType === "flat"
                      ? `+ ₹${Number(marginValue) || 0}`
                      : `+ ${Number(marginValue) || 0}%`
                  } = ₹${computedSellingPrice}`
                : "Source price link extract karne par dikhega — save par backend live price fetch karke yahi margin lagata hai."}
              {sourceInStock === false ? " · source par abhi out of stock" : ""}
            </small>
          </div>

          <label className="full-field">
            Product Images

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => uploadImages(event.target.files)}
            />

            {uploading && <small>Uploading images...</small>}

            {form.images.length > 0 && (
              <div className="image-front-preview">
                <div className="front-preview-img">
                  <img src={form.images[0]} alt="Front image preview" />
                  <span className="front-preview-badge">⭐ FRONT IMAGE</span>
                </div>
                <p>
                  <b>First image = front/cover.</b> This is the image shown on the
                  storefront. Click <b>"Set as Front"</b> on any image below.
                </p>
              </div>
            )}

            {form.images.length > 0 && (
              <div className="image-thumb-grid">
                {form.images.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className={`image-thumb ${index === 0 ? "is-front" : ""}`}
                  >
                    <img src={optimizeImage(img, 200) || img} alt="" />

                    {index === 0 && <span className="front-badge">⭐ FRONT</span>}

                    <span className="thumb-index">#{index + 1}</span>

                    <div className="thumb-actions">
                      {index !== 0 && (
                        <button
                          type="button"
                          className="thumb-front-btn"
                          onClick={() => setAsFront(index)}
                          title="Set as front image"
                        >
                          Set as Front
                        </button>
                      )}

                      <button
                        type="button"
                        className="thumb-delete-btn"
                        onClick={() => removeImage(index)}
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </label>

          <div className="full-field ai-extract-box">
            <span className="ai-extract-title">🤖 AI Screenshot Extract</span>
            <small className="ai-extract-hint">
              Upload a product screenshot from any platform (Amazon, Flipkart,
              Meesho, DigiHaat) — the AI will automatically extract specifications
              and "About this item" points and fill the fields below.
            </small>

            <div className="ai-extract-controls">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setScreenshotFile(event.target.files[0] || null)
                }
              />
              <button
                type="button"
                className="ai-extract-btn"
                disabled={extractingInfo}
                onClick={extractFromScreenshot}
              >
                {extractingInfo
                  ? "⏳ Analyzing screenshot..."
                  : "✨ Extract product info"}
              </button>
            </div>

            {screenshotFile && (
              <small className="ai-extract-selected">
                📎 {screenshotFile.name}
              </small>
            )}
          </div>

          <div className="full-field ai-extract-box ai-link-box">
            <span className="ai-extract-title">🔗 Extract from Product Link</span>
            <small className="ai-extract-hint">
              Use the Source product URL above, then press this — title, category,
              specifications, "About this item" points, images and the original
              source price are all pulled from the link.
            </small>

            <div className="ai-extract-controls">
              <input
                type="url"
                className="ai-link-input"
                value={form.sourceUrl}
                onChange={update}
                name="sourceUrl"
                placeholder="https://www.amazon.in/... or https://www.flipkart.com/..."
              />
              <button
                type="button"
                className="ai-extract-btn"
                disabled={extractingLink}
                onClick={extractFromLink}
              >
                {extractingLink
                  ? "⏳ Analyzing link..."
                  : "🔗 Extract from link"}
              </button>
            </div>
          </div>

          {extractPreview && previewDraft && (
            <div className="ai-preview-box">
              <div className="ai-preview-header">
                <span>👀 Extract Preview — edit and press Save</span>
                <div className="ai-preview-actions">
                  <button
                    type="button"
                    className="ai-preview-apply"
                    onClick={() => {
                      applyExtractedInfo(previewDraft, extractPreview.images);
                      setExtractPreview(null);
                      setPreviewDraft(null);
                      showToast("✅ Extract result saved to the form");
                    }}
                  >
                    ✅ Save to form
                  </button>
                  <button
                    type="button"
                    className="ai-preview-discard"
                    onClick={() => {
                      setExtractPreview(null);
                      setPreviewDraft(null);
                    }}
                  >
                    ✖ Discard
                  </button>
                </div>
              </div>

              {extractPreview.images.length > 0 && (
                <div className="ai-preview-images">
                  {extractPreview.images.map((img, index) => (
                    <img key={index} src={img} alt={`Product ${index + 1}`} />
                  ))}
                  <small>
                    {extractPreview.images.length} product image(s) found — they
                    will be added to "Product Images" on Save
                  </small>
                </div>
              )}

              <div className="ai-preview-fields">
                <label className="ai-edit-field">
                  <span>Brand</span>
                  <input
                    value={previewDraft.brand || ""}
                    onChange={(event) =>
                      setPreviewDraft({
                        ...previewDraft,
                        brand: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="ai-edit-field">
                  <span>Title</span>
                  <input
                    value={previewDraft.title || ""}
                    onChange={(event) =>
                      setPreviewDraft({
                        ...previewDraft,
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="ai-edit-row">
                  <label className="ai-edit-field">
                    <span>Source price (₹)</span>
                    <input
                      type="number"
                      value={previewDraft.price || ""}
                      onChange={(event) =>
                        setPreviewDraft({
                          ...previewDraft,
                          price: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="ai-edit-field">
                    <span>MRP (₹)</span>
                    <input
                      type="number"
                      value={previewDraft.mrp || ""}
                      onChange={(event) =>
                        setPreviewDraft({
                          ...previewDraft,
                          mrp: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label className="ai-edit-field">
                  <span>Description</span>
                  <textarea
                    rows="3"
                    value={previewDraft.description || ""}
                    onChange={(event) =>
                      setPreviewDraft({
                        ...previewDraft,
                        description: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="ai-preview-specs">
                <div className="ai-section-head">
                  <b>Specifications ({previewDraft.specifications.length})</b>
                  <button
                    type="button"
                    className="ai-add-row-btn"
                    onClick={() =>
                      setPreviewDraft({
                        ...previewDraft,
                        specifications: [
                          ...previewDraft.specifications,
                          { label: "", value: "" },
                        ],
                      })
                    }
                  >
                    + Add
                  </button>
                </div>
                {previewDraft.specifications.map((spec, index) => (
                  <div className="ai-preview-spec-row" key={index}>
                    <input
                      value={spec.label}
                      placeholder="Label"
                      onChange={(event) => {
                        const specs = [...previewDraft.specifications];
                        specs[index] = { ...specs[index], label: event.target.value };
                        setPreviewDraft({ ...previewDraft, specifications: specs });
                      }}
                    />
                    <input
                      value={spec.value}
                      placeholder="Value"
                      onChange={(event) => {
                        const specs = [...previewDraft.specifications];
                        specs[index] = { ...specs[index], value: event.target.value };
                        setPreviewDraft({ ...previewDraft, specifications: specs });
                      }}
                    />
                    <button
                      type="button"
                      className="ai-row-remove"
                      onClick={() =>
                        setPreviewDraft({
                          ...previewDraft,
                          specifications: previewDraft.specifications.filter(
                            (_, i) => i !== index
                          ),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="ai-preview-highlights">
                <div className="ai-section-head">
                  <b>About this item ({previewDraft.highlights.length})</b>
                  <button
                    type="button"
                    className="ai-add-row-btn"
                    onClick={() =>
                      setPreviewDraft({
                        ...previewDraft,
                        highlights: [...previewDraft.highlights, ""],
                      })
                    }
                  >
                    + Add
                  </button>
                </div>
                {previewDraft.highlights.map((item, index) => (
                  <div className="ai-highlight-row" key={index}>
                    <span>•</span>
                    <input
                      value={item}
                      placeholder="Bullet point"
                      onChange={(event) => {
                        const highlights = [...previewDraft.highlights];
                        highlights[index] = event.target.value;
                        setPreviewDraft({ ...previewDraft, highlights });
                      }}
                    />
                    <button
                      type="button"
                      className="ai-row-remove"
                      onClick={() =>
                        setPreviewDraft({
                          ...previewDraft,
                          highlights: previewDraft.highlights.filter(
                            (_, i) => i !== index
                          ),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="full-field specs-editor">
            <span className="specs-editor-title">Product Specifications</span>
            <small className="specs-editor-hint">
              Amazon-style key-value specifications (e.g. Hair Type → All, Scent →
              Rosemary, Volume → 48 ml). These will be shown as a table on the
              product page.
            </small>

            {(form.specifications || []).map((spec, index) => (
              <div className="spec-row" key={index}>
                <input
                  value={spec.label}
                  onChange={(event) =>
                    updateSpecRow(index, "label", event.target.value)
                  }
                  placeholder="Specification (e.g. Hair Type)"
                />
                <input
                  value={spec.value}
                  onChange={(event) =>
                    updateSpecRow(index, "value", event.target.value)
                  }
                  placeholder="Value (e.g. All)"
                />
                <button
                  type="button"
                  className="spec-remove-btn"
                  onClick={() => removeSpecRow(index)}
                  aria-label="Remove specification"
                >
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="spec-add-btn" onClick={addSpecRow}>
              + Add specification
            </button>
          </div>

          <div className="full-field specs-editor">
            <span className="specs-editor-title">
              About this item (bullet points)
            </span>
            <small className="specs-editor-hint">
              Like Amazon's "About this item" — each line becomes a bullet point.
            </small>

            <textarea
              className="highlights-textarea"
              rows="4"
              placeholder={
                "One line = one bullet point:\nImproves blood circulation to the scalp\nDeeply nourishes the scalp"
              }
              value={(form.highlights || []).join("\n")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  highlights: event.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>

          <label className="full-field">
            Description
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={update}
              placeholder="Product description shown on the product page"
            />
          </label>

          <div className="product-form-actions">
            <button className="save-product" disabled={saving}>
              <FiTruck />{" "}
              {saving ? "Fetching live price..." : "Add dropship product"}
            </button>
          </div>
        </form>

        {lastResult && (
          <div className="dropship-live-result">
            <b>✅ {lastResult.title} added</b>
            <span>
              Source price ₹{lastResult.sourcePrice}{" "}
              {lastResult.marginType === "flat"
                ? `+ ₹${lastResult.marginValue} flat`
                : `+ ${lastResult.marginValue}%`}{" "}
              = <b>₹{lastResult.sellingPrice}</b>
              {lastResult.inStock ? "" : " — source par out of stock (Sold Out)"}
            </span>
          </div>
        )}
      </section>

      <section className="admin-products-card">
        <div className="admin-section-title">
          <div>
            <p>DROPSHIP INVENTORY</p>
            <h2>Dropship products ({entries.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">Loading dropship products...</div>
        ) : entries.length === 0 ? (
          <div className="admin-empty">No dropship products yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Platform</th>
                  <th>Source price</th>
                  <th>Margin</th>
                  <th>Selling price</th>
                  <th>Stock</th>
                  <th>Last sync</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <div className="admin-product-cell">
                        <img
                          src={
                            optimizeImage(entry.catalog?.images?.[0], 80) ||
                            "https://placehold.co/60x60?text=Product"
                          }
                          alt={entry.title}
                        />
                        <div>
                          <b>{entry.title}</b>
                          <small>
                            {entry.isDropship ? "dropship" : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{entry.platform}</td>
                    <td>₹{entry.sourcePrice}</td>
                    <td>{marginLabel(entry)}</td>
                    <td>
                      <b>₹{entry.catalog?.price ?? entry.sellingPrice}</b>
                    </td>
                    <td>
                      <span
                        className={
                          Number(entry.catalog?.stock) > 0
                            ? "stock-active"
                            : "stock-empty"
                        }
                      >
                        {Number(entry.catalog?.stock) > 0
                          ? `${entry.catalog.stock} in stock`
                          : "Sold out"}
                      </span>
                    </td>
                    <td>
                      {entry.lastCheckedAt
                        ? new Date(entry.lastCheckedAt).toLocaleString("en-IN")
                        : "Never"}
                      {entry.lastSyncStatus === "failed" && (
                        <small className="dropship-sync-error">
                          {entry.lastSyncError || "Sync failed"}
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => syncEntry(entry)}
                          disabled={syncingId === entry._id}
                          title="Sync this product's live price"
                        >
                          <FiRefreshCw
                            className={
                              syncingId === entry._id ? "spin-icon" : undefined
                            }
                          />
                        </button>
                        <a
                          className="admin-icon-btn"
                          href={entry.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open source product"
                        >
                          <FiExternalLink />
                        </a>
                        <button
                          type="button"
                          className="admin-icon-btn danger"
                          onClick={() => removeEntry(entry)}
                          title="Delete dropship product"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card dropship-notes">
        <div className="admin-card-head">
          <h3>
            <FiLink className="head-icon" /> How dropship sync works
          </h3>
        </div>
        <ul>
          <li>Har 4 ghante source link ka price aur stock check hota hai.</li>
          <li>
            Selling price hamesha aapke margin rule se banta hai — percentage
            (100% = 2x) ya flat ₹ amount.
          </li>
          <li>Source par out of stock ho to product "Sold out" ho jata hai.</li>
          <li>
            Agar fetch fail ho ya price 0 aaye, purana price overwrite nahi hota.
          </li>
        </ul>
      </section>
    </div>
  );
}

export default DropshipProductTab;
