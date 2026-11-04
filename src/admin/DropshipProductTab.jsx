import { useCallback, useEffect, useState } from "react";
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

const emptyForm = {
  title: "",
  brand: "",
  category: "",
  platform: "Amazon",
  sourceUrl: "",
  multiplier: "2",
  stock: "20",
  description: "",
  images: [],
};

// "Dropship Product Add" — a completely separate tab from the regular
// "Add product" form. On submit the backend fetches the live source price,
// multiplies it, and creates an ordinary catalog product (plus its dropship
// metadata with `isDropship: true` and the mapped source URL).
function DropshipProductTab({ apiUrl, token, request, showToast, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  // id of the row currently re-checking its source price (per-row Sync button).
  const [syncingId, setSyncingId] = useState("");
  const [lastResult, setLastResult] = useState(null);

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

  const update = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
  };

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

    const multiplier = Number(form.multiplier);

    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 10) {
      showToast("Markup multiplier 1 se 10 ke beech hona chahiye");
      return;
    }

    try {
      setSaving(true);
      setLastResult(null);

      const data = await request(`${apiUrl}/api/admin/dropship-products`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          multiplier,
          stock: Number(form.stock) || 20,
        }),
      });

      setLastResult({
        title: data.product?.title || form.title,
        sourcePrice: data.dropship?.sourcePrice || 0,
        sellingPrice: data.dropship?.sellingPrice || data.product?.price || 0,
        multiplier,
        inStock: data.dropship?.inStock !== false,
      });

      showToast(data.message || "Dropship product added");

      setForm((current) => ({
        ...emptyForm,
        category: current.category,
      }));

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
          <label>
            Product title / name *
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={update}
              placeholder="e.g. Vitamin C Face Serum 30ml"
              required
            />
          </label>

          <label>
            Brand
            <input
              name="brand"
              type="text"
              value={form.brand}
              onChange={update}
              placeholder="Blank chhodein to platform name use hoga"
            />
          </label>

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
            Platform *
            <select name="platform" value={form.platform} onChange={update}>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>

          <label className="full-field">
            Source product URL *
            <input
              name="sourceUrl"
              type="url"
              value={form.sourceUrl}
              onChange={update}
              placeholder="https://www.amazon.in/dp/..."
              required
            />
            <small>
              Is link se live price aur stock fetch hoga — har 4 ghante
              automatically sync hota rahega.
            </small>
          </label>

          <label>
            Markup multiplier
            <input
              name="multiplier"
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={form.multiplier}
              onChange={update}
            />
            <small>
              Selling price = source price × {Number(form.multiplier) || 2}
            </small>
          </label>

          <label>
            Stock (jab source par available ho)
            <input
              name="stock"
              type="number"
              min="1"
              value={form.stock}
              onChange={update}
            />
          </label>

          <label className="full-field">
            Product images
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => uploadImages(event.target.files)}
            />
            {uploading && <small>Uploading images...</small>}

            {form.images.length > 0 && (
              <div className="image-thumb-grid">
                {form.images.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className={`image-thumb ${index === 0 ? "is-front" : ""}`}
                  >
                    <img src={optimizeImage(img, 200) || img} alt="" />
                    {index === 0 && <span className="front-badge">⭐ FRONT</span>}
                    <div className="thumb-actions">
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

          <label className="full-field">
            Description
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={update}
              placeholder="Product description shown on the product page"
            />
          </label>

          <div className="product-form-actions">
            <button className="save-product" disabled={saving}>
              <FiTruck /> {saving ? "Fetching live price..." : "Add dropship product"}
            </button>
          </div>
        </form>

        {lastResult && (
          <div className="dropship-live-result">
            <b>✅ {lastResult.title} added</b>
            <span>
              Source price ₹{lastResult.sourcePrice} × {lastResult.multiplier} ={" "}
              <b>₹{lastResult.sellingPrice}</b>
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
                            {entry.multiplier}× markup
                            {entry.isDropship ? " · dropship" : ""}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{entry.platform}</td>
                    <td>₹{entry.sourcePrice}</td>
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
            Source price × multiplier hi website ka selling price hai (₹120 → ₹240
            with 2×).
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
