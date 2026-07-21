import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

const categories = [
  "Skincare",
  "Makeup",
  "Haircare",
  "Fragrance",
  "Bath & Body",
];

const initialForm = {
  brand: "",
  title: "",
  description: "",
  category: "Skincare",
  price: "",
  mrp: "",
  rating: "4.5",
  reviews: "0",
  image: "",
  badge: "",
  stock: "10",
  isFeatured: false,
  amazonLink: "",
  flipkartLink: "",
  otherMarketplaceName: "",
  otherMarketplaceLink: "",
};

function AdminPanel({ apiUrl, onBack, showToast }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/products`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message);
      }

      setProducts(data.products || []);
    } catch {
      showToast("Could not load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return products;

    return products.filter((product) =>
      [product.brand, product.title, product.category]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [products, search]);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      brand: product.brand || "",
      title: product.title || "",
      description: product.description || "",
      category: product.category || "Skincare",
      price: String(product.price ?? ""),
      mrp: String(product.mrp ?? ""),
      rating: String(product.rating ?? 4.5),
      reviews: String(product.reviews ?? 0),
      image: product.image || "",
      badge: product.badge || "",
      stock: String(product.stock ?? 0),
      isFeatured: Boolean(product.isFeatured),
      amazonLink:
        product.marketplaceLinks?.find(
          (link) => link.platform?.toLowerCase() === "amazon"
        )?.url || "",
      flipkartLink:
        product.marketplaceLinks?.find(
          (link) => link.platform?.toLowerCase() === "flipkart"
        )?.url || "",
      otherMarketplaceName:
        product.marketplaceLinks?.find(
          (link) =>
            !["amazon", "flipkart"].includes(link.platform?.toLowerCase())
        )?.platform || "",
      otherMarketplaceLink:
        product.marketplaceLinks?.find(
          (link) =>
            !["amazon", "flipkart"].includes(link.platform?.toLowerCase())
        )?.url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(initialForm);
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const marketplaceLinks = [
  form.amazonLink.trim() && {
    platform: "Amazon",
    url: form.amazonLink.trim(),
  },
  form.flipkartLink.trim() && {
    platform: "Flipkart",
    url: form.flipkartLink.trim(),
  },
  form.otherMarketplaceName.trim() &&
    form.otherMarketplaceLink.trim() && {
      platform: form.otherMarketplaceName.trim(),
      url: form.otherMarketplaceLink.trim(),
    },
      ].filter(Boolean);

      const productPayload = {
        ...form,
        marketplaceLinks,
      };

      delete productPayload.amazonLink;
      delete productPayload.flipkartLink;
      delete productPayload.otherMarketplaceName;
      delete productPayload.otherMarketplaceLink;
      const response = await fetch(
        editingId
          ? `${apiUrl}/api/products/${editingId}`
          : `${apiUrl}/api/products`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productPayload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save product");
      }

      showToast(editingId ? "Product updated successfully" : "Product added successfully");
      cancelEdit();
      loadProducts();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete "${product.title}"?`);

    if (!confirmed) return;

    try {
      const response = await fetch(`${apiUrl}/api/products/${product._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete product");
      }

      showToast("Product deleted");
      loadProducts();
    } catch (error) {
      showToast(error.message);
    }
  };

  const updateStock = async (product, value) => {
    const stock = Number(value);

    if (!Number.isFinite(stock) || stock < 0) {
      showToast("Enter a valid stock quantity");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/products/${product._id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update stock");
      }

      showToast("Stock updated");
      loadProducts();
    } catch (error) {
      showToast(error.message);
    }
  };

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="admin-back" onClick={onBack}>← Store</button>

        <div>
          <p>DEALROOT BEAUTY</p>
          <h1>Product Admin Panel</h1>
        </div>

        <button className="admin-refresh" onClick={loadProducts}>↻ Refresh</button>
      </header>

      <main className="admin-content">
        <section className="admin-stats">
          <article><span>Total products</span><strong>{products.length}</strong></article>
          <article><span>Total stock</span><strong>{totalStock}</strong></article>
          <article>
            <span>Out of stock</span>
            <strong>{products.filter((product) => Number(product.stock) === 0).length}</strong>
          </article>
          <article>
            <span>Featured products</span>
            <strong>{products.filter((product) => product.isFeatured).length}</strong>
          </article>
        </section>

        <section className="admin-form-card">
          <div className="admin-section-title">
            <div>
              <p>{editingId ? "EDIT PRODUCT" : "NEW PRODUCT"}</p>
              <h2>{editingId ? "Update product details" : "Add a product to DEALROOT"}</h2>
            </div>

            {editingId && (
              <button className="cancel-edit" onClick={cancelEdit}>Cancel edit</button>
            )}
          </div>

          <form className="product-form" onSubmit={saveProduct}>
            <label>
              Brand *
              <input name="brand" value={form.brand} onChange={updateForm} required placeholder="e.g. Minimalist" />
            </label>

            <label>
              Product title *
              <input name="title" value={form.title} onChange={updateForm} required placeholder="e.g. Vitamin C Face Serum" />
            </label>

            <label>
              Category *
              <select name="category" value={form.category} onChange={updateForm}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>

            <label>
              Stock *
              <input name="stock" type="number" min="0" value={form.stock} onChange={updateForm} required />
            </label>

            <label>
              Selling price (₹) *
              <input name="price" type="number" min="0" value={form.price} onChange={updateForm} required />
            </label>

            <label>
              MRP (₹) *
              <input name="mrp" type="number" min="0" value={form.mrp} onChange={updateForm} required />
            </label>

            <label>
              Rating
              <input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={updateForm} />
            </label>

            <label>
              Number of reviews
              <input name="reviews" type="number" min="0" value={form.reviews} onChange={updateForm} />
            </label>

            <label className="full-field">
              Product image URL
              <input name="image" type="url" value={form.image} onChange={updateForm} placeholder="https://..." />
            </label>

            <label>
              Amazon product link
              <input name="amazonLink" type="url" value={form.amazonLink} onChange={updateForm} placeholder="https://www.amazon.in/..." />
            </label>

            <label>
              Flipkart product link
              <input name="flipkartLink" type="url" value={form.flipkartLink} onChange={updateForm} placeholder="https://www.flipkart.com/..." />
            </label>

            <label>
              Other platform name
              <input name="otherMarketplaceName" value={form.otherMarketplaceName} onChange={updateForm} placeholder="e.g. Nykaa or Myntra" />
            </label>

            <label>
              Other platform link
              <input name="otherMarketplaceLink" type="url" value={form.otherMarketplaceLink} onChange={updateForm} placeholder="https://..." />
            </label>

            <label>
              Product badge
              <input name="badge" value={form.badge} onChange={updateForm} placeholder="Bestseller / Save 25%" />
            </label>

            <label className="featured-check">
              <input name="isFeatured" type="checkbox" checked={form.isFeatured} onChange={updateForm} />
              Show as a featured product
            </label>

            <label className="full-field">
              Description
              <textarea name="description" value={form.description} onChange={updateForm} rows="3" placeholder="Short product description..." />
            </label>

            <button className="save-product" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
            </button>
          </form>
        </section>

        <section className="admin-products-card">
          <div className="admin-section-title">
            <div>
              <p>LIVE INVENTORY</p>
              <h2>Manage your products</h2>
            </div>

            <input
              className="admin-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
            />
          </div>

          {loading ? (
            <div className="admin-empty">Loading products...</div>
          ) : visibleProducts.length === 0 ? (
            <div className="admin-empty">No product found.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="admin-product-name">
                          <img src={product.image || "https://placehold.co/80x80?text=Product"} alt="" />
                          <div>
                            <b>{product.title}</b>
                            <span>{product.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <b>₹{product.price}</b>
                        <small>MRP ₹{product.mrp}</small>
                      </td>
                      <td>
                        <div className="stock-editor">
                          <input
                            key={`${product._id}-${product.stock}`}
                            type="number"
                            min="0"
                            defaultValue={product.stock}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                updateStock(product, event.currentTarget.value);
                              }
                            }}
                          />
                          <button onClick={(event) => {
                            const input = event.currentTarget.previousElementSibling;
                            updateStock(product, input.value);
                          }}>
                            Save
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={product.stock > 0 ? "stock-active" : "stock-empty"}>
                          {product.stock > 0 ? "In stock" : "Out of stock"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button onClick={() => startEdit(product)}>Edit</button>
                          <button className="delete-button" onClick={() => deleteProduct(product)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;
