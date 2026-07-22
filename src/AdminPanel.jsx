import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

const categories = [
  "Skincare",
  "Makeup",
  "Haircare",
  "Fragrance",
  "Bath & Body",
];

const orderStatuses = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

const emptyForm = {
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
  const [token, setToken] = useState(
    () => sessionStorage.getItem("dealroot_admin_token") || ""
  );

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const [loggingIn, setLoggingIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [search, setSearch] = useState("");

  const logOut = (message = "Logged out successfully") => {
    sessionStorage.removeItem("dealroot_admin_token");
    setToken("");
    setProducts([]);
    setOrders([]);
    setCredentials({ email: "", password: "" });

    if (message) {
      showToast(message);
    }
  };

  const request = async (url, options = {}) => {
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let response;
    let data;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });

      data = await response.json();
    } catch {
      throw new Error("Could not connect to the backend. Please try again.");
    }

    if (!response.ok || !data.success) {
      if (response.status === 401 && token) {
        logOut("Your admin session has expired. Please log in again.");
      }

      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      const data = await request(`${apiUrl}/api/products`);
      setProducts(data.products || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);

      const data = await request(`${apiUrl}/api/orders`);
      setOrders(data.orders || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProducts();
      loadOrders();
    }
  }, [token]);

  const refresh = () => {
    loadProducts();
    loadOrders();
  };

  const logIn = async (event) => {
    event.preventDefault();

    try {
      setLoggingIn(true);

      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      sessionStorage.setItem("dealroot_admin_token", data.token);
      setToken(data.token);
      setCredentials({ email: "", password: "" });
      showToast("Admin login successful");
    } catch (error) {
      showToast(error.message || "Could not log in");
    } finally {
      setLoggingIn(false);
    }
  };

  const updateForm = ({ target }) => {
    setForm((current) => ({
      ...current,
      [target.name]:
        target.type === "checkbox" ? target.checked : target.value,
    }));
  };

  const visibleProducts = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return products;
    }

    return products.filter((product) =>
      [product.brand, product.title, product.category]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [products, search]);

  const startEdit = (product) => {
    const otherMarketplace = product.marketplaceLinks?.find(
      (link) =>
        !["amazon", "flipkart"].includes(link.platform?.toLowerCase())
    );

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
      otherMarketplaceName: otherMarketplace?.platform || "",
      otherMarketplaceLink: otherMarketplace?.url || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const marketplaceLinks = [
        {
          platform: "Amazon",
          url: form.amazonLink.trim(),
        },
        {
          platform: "Flipkart",
          url: form.flipkartLink.trim(),
        },
        {
          platform: form.otherMarketplaceName.trim(),
          url: form.otherMarketplaceLink.trim(),
        },
      ].filter((link) => link.platform && link.url);

      const payload = {
        ...form,
        marketplaceLinks,
      };

      delete payload.amazonLink;
      delete payload.flipkartLink;
      delete payload.otherMarketplaceName;
      delete payload.otherMarketplaceLink;

      await request(
        editingId
          ? `${apiUrl}/api/products/${editingId}`
          : `${apiUrl}/api/products`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

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
    const confirmDelete = window.confirm(
      `Delete "${product.title}" permanently?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await request(`${apiUrl}/api/products/${product._id}`, {
        method: "DELETE",
      });

      showToast("Product deleted successfully");
      loadProducts();
    } catch (error) {
      showToast(error.message);
    }
  };

  const updateStock = async (product, value) => {
    const stock = Number(value);

    if (!Number.isInteger(stock) || stock < 0) {
      showToast("Stock must be a whole number greater than or equal to 0");
      return;
    }

    try {
      await request(`${apiUrl}/api/products/${product._id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock }),
      });

      showToast("Stock updated successfully");
      loadProducts();
    } catch (error) {
      showToast(error.message);
    }
  };

  const updateOrderStatus = async (orderId, orderStatus) => {
    try {
      setUpdatingOrderId(orderId);

      const data = await request(
        `${apiUrl}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderStatus }),
        }
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? data.order : order
        )
      );

      showToast("Order status updated");
    } catch (error) {
      showToast(error.message);
    } finally {
      setUpdatingOrderId("");
    }
  };

  const cancelOrder = async (order) => {
    const confirmCancel = window.confirm(
      `Cancel ${order.orderNumber}? Product stock will be restored.`
    );

    if (!confirmCancel) {
      return;
    }

    try {
      setUpdatingOrderId(order._id);

      const data = await request(
        `${apiUrl}/api/orders/${order._id}/cancel`,
        {
          method: "POST",
        }
      );

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder._id === order._id ? data.order : currentOrder
        )
      );

      loadProducts();
      showToast("Order cancelled and stock restored");
    } catch (error) {
      showToast(error.message);
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (!token) {
    return (
      <div className="admin-login-page">
        <form className="admin-login-card" onSubmit={logIn}>
          <button type="button" className="admin-back" onClick={onBack}>
            ← Store
          </button>

          <p>DEALROOT BEAUTY</p>
          <h1>Admin sign in</h1>
          <span>
            Only authorized store administrators can manage products and orders.
          </span>

          <label>
            Email
            <input
              type="email"
              required
              value={credentials.email}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Admin email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Admin password"
            />
          </label>

          <button className="save-product" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Secure sign in"}
          </button>
        </form>
      </div>
    );
  }

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.orderStatus)
  ).length;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="admin-back" onClick={onBack}>
          ← Store
        </button>

        <div>
          <p>DEALROOT BEAUTY</p>
          <h1>Product Admin Panel</h1>
        </div>

        <div className="admin-header-actions">
          <button className="admin-refresh" onClick={refresh}>
            ↻ Refresh
          </button>

          <button className="admin-back" onClick={() => logOut()}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-content">
        <section className="admin-stats">
          <article>
            <span>Total products</span>
            <strong>{products.length}</strong>
          </article>

          <article>
            <span>Total stock</span>
            <strong>{totalStock}</strong>
          </article>

          <article>
            <span>Out of stock</span>
            <strong>
              {products.filter((product) => Number(product.stock) === 0).length}
            </strong>
          </article>

          <article>
            <span>Pending orders</span>
            <strong>{pendingOrders}</strong>
          </article>
        </section>

        <section className="admin-form-card">
          <div className="admin-section-title">
            <div>
              <p>{editingId ? "EDIT PRODUCT" : "NEW PRODUCT"}</p>
              <h2>
                {editingId
                  ? "Update product details"
                  : "Add a product to DEALROOT"}
              </h2>
            </div>

            {editingId && (
              <button className="cancel-edit" type="button" onClick={cancelEdit}>
                Cancel edit
              </button>
            )}
          </div>

          <form className="product-form" onSubmit={saveProduct}>
            {[
              ["brand", "Brand *", "text"],
              ["title", "Product title *", "text"],
              ["stock", "Stock *", "number"],
              ["price", "Selling price (₹) *", "number"],
              ["mrp", "MRP (₹) *", "number"],
              ["rating", "Rating", "number"],
              ["reviews", "Number of reviews", "number"],
              ["image", "Product image URL", "url"],
              ["amazonLink", "Amazon product link", "url"],
              ["flipkartLink", "Flipkart product link", "url"],
              ["otherMarketplaceName", "Other platform name", "text"],
              ["otherMarketplaceLink", "Other platform link", "url"],
              ["badge", "Product badge", "text"],
            ].map(([name, label, type]) => (
              <label
                key={name}
                className={name === "image" ? "full-field" : ""}
              >
                {label}

                <input
                  name={name}
                  type={type}
                  min={type === "number" ? "0" : undefined}
                  step={name === "rating" ? "0.1" : undefined}
                  value={form[name]}
                  onChange={updateForm}
                  required={["brand", "title", "stock", "price", "mrp"].includes(
                    name
                  )}
                />
              </label>
            ))}

            <label>
              Category *
              <select
                name="category"
                value={form.category}
                onChange={updateForm}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="featured-check">
              <input
                name="isFeatured"
                type="checkbox"
                checked={form.isFeatured}
                onChange={updateForm}
              />
              Show as featured product
            </label>

            <label className="full-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                rows="3"
              />
            </label>

            <button className="save-product" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add product"}
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
            <div className="admin-empty">No products found.</div>
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
                          <img
                            src={
                              product.image ||
                              "https://placehold.co/80x80?text=Product"
                            }
                            alt={product.title}
                          />

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
                                event.preventDefault();
                                updateStock(product, event.currentTarget.value);
                              }
                            }}
                          />

                          <button
                            type="button"
                            onClick={(event) =>
                              updateStock(
                                product,
                                event.currentTarget.previousElementSibling.value
                              )
                            }
                          >
                            Save
                          </button>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            Number(product.stock) > 0
                              ? "stock-active"
                              : "stock-empty"
                          }
                        >
                          {Number(product.stock) > 0
                            ? "In stock"
                            : "Out of stock"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <button type="button" onClick={() => startEdit(product)}>
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => deleteProduct(product)}
                          >
                            Delete
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

        <section className="admin-products-card">
          <div className="admin-section-title">
            <div>
              <p>CUSTOMER ORDERS</p>
              <h2>Manage COD orders</h2>
            </div>

            <button className="admin-refresh" onClick={loadOrders}>
              ↻ Refresh orders
            </button>
          </div>

          {ordersLoading ? (
            <div className="admin-empty">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="admin-empty">No orders have been placed yet.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer & delivery</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <b>{order.orderNumber}</b>
                        <small>
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </small>
                      </td>

                      <td>
                        <b>{order.customer?.name}</b>
                        <small>{order.customer?.phone}</small>
                        <small>
                          {order.customer?.address}, {order.customer?.city} -{" "}
                          {order.customer?.pincode}
                        </small>
                      </td>

                      <td>
                        {order.items?.map((item) => (
                          <small key={item._id || item.product}>
                            {item.title} × {item.quantity} — ₹{item.subtotal}
                          </small>
                        ))}
                      </td>

                      <td>
                        <b>₹{order.totalAmount}</b>
                        {Number(order.deliveryFee) > 0 && (
                          <small>Delivery: ₹{order.deliveryFee}</small>
                        )}
                      </td>

                      <td>
                        <b>Cash on Delivery</b>
                        <small>
                          {order.paymentStatus === "paid"
                            ? "Paid"
                            : "Payment pending"}
                        </small>
                      </td>

                      <td>
                        {order.orderStatus === "cancelled" ? (
                          <span className="stock-empty">
                            Cancelled · stock restored
                          </span>
                        ) : (
                          <div className="order-actions">
                            <select
                              value={order.orderStatus}
                              disabled={updatingOrderId === order._id}
                              onChange={(event) =>
                                updateOrderStatus(
                                  order._id,
                                  event.target.value
                                )
                              }
                            >
                              {orderStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status[0].toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>

                            {!["shipped", "delivered"].includes(
                              order.orderStatus
                            ) && (
                              <button
                                type="button"
                                className="cancel-order"
                                disabled={updatingOrderId === order._id}
                                onClick={() => cancelOrder(order)}
                              >
                                {updatingOrderId === order._id
                                  ? "Updating..."
                                  : "Cancel + restore stock"}
                              </button>
                            )}
                          </div>
                        )}
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