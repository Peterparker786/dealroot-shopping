import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

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

  images: [],

  badge: "",
  stock: "10",
  isFeatured: false,
  dealType: "none",
  amazonLink: "",
  flipkartLink: "",
  otherMarketplaceName: "",
  otherMarketplaceLink: "",

  specifications: [],
  highlights: [],
};

function AdminPanel({
  apiUrl,
  onBack,
  showToast,
  categories,
  onAddCategory,
  onRemoveCategory,
}) {
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
  const [coupons, setCoupons] = useState([]);
  const [banners, setBanners] = useState([]);

const [bannerForm, setBannerForm] = useState({
  buttonLink: "",
  image: "",
  active: true,
});

const [editingBannerId, setEditingBannerId] = useState("");
const [uploadingBanner, setUploadingBanner] = useState(false);

const [couponForm, setCouponForm] = useState({
  code: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrder: "",
  maximumDiscount: "",
  expiryDate: "",
});
const [categoryForm, setCategoryForm] = useState({
  name: "",
  emoji: "✨",
  color: "#f5f5f5",
});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
const [uploadingImages, setUploadingImages] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [search, setSearch] = useState("");

  const [extractingInfo, setExtractingInfo] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);

  const [extractLink, setExtractLink] = useState("");
  const [extractingLink, setExtractingLink] = useState(false);
  const [extractPreview, setExtractPreview] = useState(null);
  const [previewDraft, setPreviewDraft] = useState(null);

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
    loadCoupons();
    loadBanners();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);

const refresh = () => {
  loadProducts();
  loadOrders();
  loadCoupons();
  loadBanners();
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

  const loadCoupons = async () => {
  try {
    const data = await request(`${apiUrl}/api/coupons`);
    setCoupons(data.coupons || []);
  } catch (error) {
    showToast(error.message);
  }
};

const loadBanners = async () => {
  try {
    const data = await request(`${apiUrl}/api/banners`);
    setBanners(data.banners || []);
  } catch (error) {
    showToast(error.message);
  }
};

  const updateForm = ({ target }) => {
    const value =
      target.type === "checkbox" ? target.checked : target.value;

    setForm((current) => {
      if (target.name === "dealType" && value !== "none") {
        return {
          ...current,
          dealType: value,
          price: value,
        };
      }

      return {
        ...current,
        [target.name]: value,
      };
    });
  };

  const uploadImages = async (files) => {
  try {
    setUploadingImages(true);

    const formData = new FormData();

    [...files].forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(`${apiUrl}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log("UPLOAD RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Upload failed");
    }

    setForm((current) => ({
      ...current,
      images: [...current.images, ...data.images],
    }));

    setSelectedImages((current) => {
  const updated = [...current, ...data.images];
  console.log("UPDATED IMAGES:", updated);
  return updated;
});

    showToast("Images uploaded successfully");
  } catch (error) {
    showToast(error.message);
  } finally {
    setUploadingImages(false);
  }
};

const uploadBannerImage = async (file) => {
  try {
    setUploadingBanner(true);

    const formData = new FormData();
    formData.append("images", file);

    const response = await fetch(`${apiUrl}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Upload failed");
    }

    setBannerForm((current) => ({
      ...current,
      image: data.images[0],
    }));

    showToast("Banner image uploaded");
  } catch (error) {
    showToast(error.message);
  } finally {
    setUploadingBanner(false);
  }
};

const saveBanner = async (e) => {
  e.preventDefault();

  try {
    const data = await request(
      editingBannerId
        ? `${apiUrl}/api/banners/${editingBannerId}`
        : `${apiUrl}/api/banners`,
      {
        method: editingBannerId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerForm),
      }
    );

    showToast(data.message || "Banner saved");

    setBannerForm({
      buttonLink: "",
      image: "",
      active: true,
    });

    setEditingBannerId("");

    loadBanners();
  } catch (error) {
    showToast(error.message);
  }
};

const editBanner = (banner) => {
  setEditingBannerId(banner._id);

  setBannerForm({
    buttonLink: banner.buttonLink || "",
    image: banner.image || "",
    active: banner.active,
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const deleteBanner = async (id) => {
  if (!window.confirm("Delete this banner?")) return;

  try {
    const data = await request(`${apiUrl}/api/banners/${id}`, {
      method: "DELETE",
    });

    showToast(data.message || "Banner deleted");

    loadBanners();
  } catch (error) {
    showToast(error.message);
  }
};


  const visibleProducts = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return products;
    }

    return products.filter((product) =>
      [
        product.brand,
        product.title,
        product.category,
        product.dealType === "99"
          ? "99 deals"
          : product.dealType === "199"
            ? "199 deals"
            : "regular",
      ]
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

  images: product.images || [],

  badge: product.badge || "",
  stock: String(product.stock ?? 0),
  isFeatured: Boolean(product.isFeatured),
  dealType: product.dealType || "none",

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

  specifications: Array.isArray(product.specifications)
    ? product.specifications.map((spec) => ({
        label: spec?.label || "",
        value: spec?.value || "",
      }))
    : [],

  highlights: Array.isArray(product.highlights)
    ? product.highlights.filter((item) => String(item).trim())
    : [],
});

// 👇 YE OBJECT KE BAHAR HONA CHAHIYE
setSelectedImages(product.images || []);

window.scrollTo({
  top: 0,
  behavior: "smooth",
});
  };

 const cancelEdit = () => {
  setEditingId("");
  setForm(emptyForm);
  setSelectedImages([]);
};

  // Set an image as the front/cover image (moves it to index 0)
  // selectedImages is the single source of truth — saveProduct uses it.
  const setAsFront = (index) => {
    if (index <= 0) return;

    setSelectedImages((current) => {
      if (index >= current.length) return current;

      const updated = [...current];
      const [picked] = updated.splice(index, 1);
      updated.unshift(picked);
      return updated;
    });

    showToast("Set as front image — yeh image storefront par dikhegi");
  };

  const removeImage = (index) => {
    setSelectedImages((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  // Apply an extracted result (info + images) into the form
  const applyExtractedInfo = (info, images) => {
    setForm((current) => ({
      ...current,
      brand: info.brand || current.brand,
      title: info.title || current.title,
      price: info.price ? String(info.price) : current.price,
      mrp: info.mrp ? String(info.mrp) : current.mrp,
      description: info.description || current.description,
      specifications:
        Array.isArray(info.specifications) &&
        info.specifications.length > 0
          ? info.specifications
          : current.specifications,
      highlights:
        Array.isArray(info.highlights) && info.highlights.length > 0
          ? info.highlights
          : current.highlights,
    }));

    if (Array.isArray(images) && images.length > 0) {
      setSelectedImages((current) => {
        const existing = new Set(current);
        const fresh = images.filter((img) => !existing.has(img));
        return [...current, ...fresh];
      });
    }
  };

  // AI screenshot extraction — shows a preview first, then Apply fills form
  const extractFromScreenshot = async () => {
    if (!screenshotFile) {
      showToast("Pehle product ka screenshot choose karein");
      return;
    }

    try {
      setExtractingInfo(true);

      const formData = new FormData();
      formData.append("image", screenshotFile);

      const response = await fetch(
        `${apiUrl}/api/products/extract-info`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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
          "⚠️ Screenshot me product info nahi mili — clear / close-up screenshot try karein"
        );
        return;
      }

      const preview = {
        info,
        images: data.images || [],
        source: "screenshot",
      };

      setExtractPreview(preview);
      setPreviewDraft({
        ...info,
        specifications: (info.specifications || []).map((spec) => ({
          label: spec?.label || "",
          value: spec?.value || "",
        })),
        highlights: [...(info.highlights || [])],
      });

      showToast("✨ Extract ho gaya — neeche preview review karke Save dabayein");
    } catch (error) {
      showToast(error.message);
    } finally {
      setExtractingInfo(false);
    }
  };

  // AI link extraction — fetch product info + images from a store link
  const extractFromLink = async () => {
    const url = extractLink.trim();

    if (!url) {
      showToast("Pehle product ki link paste karein");
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      showToast("Valid link paste karein (https://...)");
      return;
    }

    try {
      setExtractingLink(true);

      const response = await fetch(
        `${apiUrl}/api/products/extract-from-link`,
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

      const preview = {
        info,
        images: data.images || [],
        source: "link",
      };

      setExtractPreview(preview);
      setPreviewDraft({
        ...info,
        specifications: (info.specifications || []).map((spec) => ({
          label: spec?.label || "",
          value: spec?.value || "",
        })),
        highlights: [...(info.highlights || [])],
      });

      showToast(
        `✨ Link se ${(info.specifications || []).length} specs + ${
          (info.highlights || []).length
        } points + ${(data.images || []).length} images mili — review karke Save dabayein`
      );
    } catch (error) {
      showToast(error.message);
    } finally {
      setExtractingLink(false);
    }
  };

  // Specifications editor helpers
  const addSpecRow = () => {
    setForm((current) => ({
      ...current,
      specifications: [
        ...(current.specifications || []),
        { label: "", value: "" },
      ],
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
      console.log("FORM IMAGES:", form.images);
      console.log("SELECTED IMAGES:", selectedImages);
      payload.images = selectedImages;

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

setSelectedImages([]);

showToast(
  editingId
    ? "Product updated successfully"
    : "Product added successfully"
);

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

  const createCoupon = async (e) => {
  e.preventDefault();

  try {
    const data = await request(`${apiUrl}/api/coupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(couponForm),
    });

    showToast(data.message);

    setCouponForm({
      code: "",
      discountType: "percentage",
      discountValue: "",
      minimumOrder: "",
      maximumDiscount: "",
      expiryDate: "",
    });

    loadCoupons();
  } catch (error) {
    showToast(error.message);
  }
};

const deleteCoupon = async (id) => {
  if (!window.confirm("Delete this coupon?")) return;

  try {
    const data = await request(`${apiUrl}/api/coupons/${id}`, {
      method: "DELETE",
    });

    showToast(data.message);
    loadCoupons();
  } catch (error) {
    showToast(error.message);
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
      <p>MARKETING</p>
      <h2>Offer Banner</h2>
    </div>
  </div>

  <div className="banner-size-hint">
    📐 <b>Recommended banner size: 1080 × 1080 px</b> (square)
    <br />
    Square image sabse sahi dikhega. Iske alawa 800 × 800 ya 1024 × 1024
    bhi chale ga. Text banner ke beech me rakhein taaki crop na ho.
  </div>

  <form className="product-form" onSubmit={saveBanner}>

    <label className="full-field">
      Banner Image

      <input
        type="file"
        accept="image/*"
        onChange={(e) => uploadBannerImage(e.target.files[0])}
      />

      {uploadingBanner && (
        <small>Uploading banner...</small>
      )}

      {bannerForm.image && (
        <img
          src={bannerForm.image}
          alt="Banner preview"
          className="banner-preview-img"
        />
      )}
    </label>

    <label className="full-field">
      Redirect Link
      <input
        value={bannerForm.buttonLink}
        onChange={(e) =>
          setBannerForm({
            ...bannerForm,
            buttonLink: e.target.value,
          })
        }
        placeholder="e.g. /product/6a699b... ya https://yoursite.com/..."
      />
      <small>
        Banner par click karne se log is link par pahuchenge. Khali chhod do to
        products section par le jayega. App ka page ho to <b>/product/...</b>,
        bahar ka link ho to <b>https://...</b> paste karein.
      </small>
    </label>

    <label className="featured-check">
      <input
        type="checkbox"
        checked={bannerForm.active}
        onChange={(e) =>
          setBannerForm({
            ...bannerForm,
            active: e.target.checked,
          })
        }
      />
      Active Banner (home page par dikhe)
    </label>

    <button className="save-product">
      {editingBannerId ? "Update Banner" : "Save Banner"}
    </button>

  </form>
</section>

<section className="admin-products-card">
  <div className="admin-section-title">
    <div>
      <p>LIVE BANNERS</p>
      <h2>Manage Offer Banners</h2>
    </div>
  </div>

  {banners.length === 0 ? (
    <div className="admin-empty">No banners found.</div>
  ) : (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Redirect Link</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {banners.map((banner) => (
            <tr key={banner._id}>
              <td>
                <img
                  src={banner.image}
                  alt=""
                  style={{
                    width: 120,
                    borderRadius: 8,
                  }}
                />
              </td>

              <td>
                <b>{banner.buttonLink || "Products"}</b>
                <br />
                <small>
                  {banner.buttonLink
                    ? banner.buttonLink.startsWith("http")
                      ? "External link (naya tab)"
                      : "App ka page"
                    : "Default — products section"}
                </small>
              </td>

              <td>
                {banner.active ? (
                  <span className="stock-active">
                    Active
                  </span>
                ) : (
                  <span className="stock-empty">
                    Inactive
                  </span>
                )}
              </td>

              <td>
                <div className="admin-actions">
                  <button
                    onClick={() => editBanner(banner)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteBanner(banner._id)
                    }
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

        <section className="admin-form-card">
  <div className="admin-section-title">
    <div>
      <p>COUPON MANAGEMENT</p>
      <h2>Create Discount Coupon</h2>
    </div>
  </div>

  <form className="product-form" onSubmit={createCoupon}>

    <label>
      Coupon Code
      <input
        value={couponForm.code}
        onChange={(e)=>
          setCouponForm({
            ...couponForm,
            code:e.target.value.toUpperCase()
          })
        }
      />
    </label>

    <label>
      Discount Type
      <select
        value={couponForm.discountType}
        onChange={(e)=>
          setCouponForm({
            ...couponForm,
            discountType:e.target.value
          })
        }
      >
        <option value="percentage">Percentage</option>
        <option value="flat">Flat</option>
      </select>
    </label>

    <label>
      Discount Value
      <input
        type="number"
        value={couponForm.discountValue}
        onChange={(e)=>
          setCouponForm({
            ...couponForm,
            discountValue:e.target.value
          })
        }
      />
    </label>

    <label>
      Minimum Order
      <input
        type="number"
        value={couponForm.minimumOrder}
        onChange={(e)=>
          setCouponForm({
            ...couponForm,
            minimumOrder:e.target.value
          })
        }
      />
    </label>

    <label>
      Maximum Discount
      <input
        type="number"
        value={couponForm.maximumDiscount}
        onChange={(e)=>
          setCouponForm({
            ...couponForm,
            maximumDiscount:e.target.value
          })
        }
      />
    </label>

    <label>
      Expiry Date
      <input
        type="date"
        value={couponForm.expiryDate}
        onChange={(e)=>
          setCouponForm({
            ...couponForm,
            expiryDate:e.target.value
          })
        }
      />
    </label>

    <button className="save-product">
      Create Coupon
    </button>

  </form>
</section>

<section className="admin-form-card">
  <div className="admin-section-title">
    <div>
      <p>CATEGORY MANAGEMENT</p>
      <h2>Add / Remove Store Categories</h2>
    </div>
  </div>

  <form
    className="product-form"
    onSubmit={(e) => {
      e.preventDefault();
      onAddCategory(categoryForm.name, categoryForm.emoji, categoryForm.color);
      setCategoryForm({ name: "", emoji: "✨", color: "#f5f5f5" });
    }}
  >
    <label>
      Category name *
      <input
        value={categoryForm.name}
        onChange={(e) =>
          setCategoryForm({ ...categoryForm, name: e.target.value })
        }
        placeholder="e.g. Wellness"
        required
      />
    </label>

    <label>
      Emoji
      <input
        value={categoryForm.emoji}
        onChange={(e) =>
          setCategoryForm({ ...categoryForm, emoji: e.target.value })
        }
        placeholder="e.g. 🌿"
        maxLength={4}
      />
    </label>

    <label>
      Circle colour
      <input
        type="color"
        value={categoryForm.color}
        onChange={(e) =>
          setCategoryForm({ ...categoryForm, color: e.target.value })
        }
        style={{ height: 44, padding: 6, cursor: "pointer" }}
      />
    </label>

    <div className="full-field">
      <button className="save-product" disabled={!categoryForm.name.trim()}>
        + Add Category
      </button>
      <small style={{ display: "block", marginTop: 8 }}>
        Nayi category turant home page ke "Shop by Category" aur is product form
        ke dropdown me dikhegi. Storage: is browser me save rehti hai.
      </small>
    </div>
  </form>

  <div className="category-list">
    {(categories || []).map((category) => (
      <div className="category-list-item" key={category.name}>
        <span
          className="category-list-emoji"
          style={{ background: category.color }}
        >
          {category.emoji}
        </span>
        <b>{category.label || category.name}</b>
        <small>{category.name}</small>
        <button
          type="button"
          className="category-remove-btn"
          onClick={() => onRemoveCategory(category.name)}
          aria-label={`Remove ${category.name} category`}
        >
          ×
        </button>
      </div>
    ))}
  </div>
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
                {(categories || []).map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.label || category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Deal section
              <select
                name="dealType"
                value={form.dealType}
                onChange={updateForm}
              >
                <option value="none">Regular product (No deal)</option>
                <option value="99">₹99 Deals</option>
                <option value="199">₹199 Deals</option>
              </select>
              <small>
                Selecting a deal automatically sets the selling price.
              </small>
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
  Product Images

  <input
    type="file"
    multiple
    accept="image/*"
    onChange={(e) => uploadImages(e.target.files)}
  />

  {uploadingImages && (
    <small>Uploading images...</small>
  )}

  {selectedImages.length > 0 && (
    <div className="image-front-preview">
      <div className="front-preview-img">
        <img src={selectedImages[0]} alt="Front image preview" />
        <span className="front-preview-badge">⭐ FRONT IMAGE</span>
      </div>
      <p>
        <b>First image = front/cover.</b> Yehi image storefront par show hogi —
        products list, flash deals aur product page par sabse pehle dikhegi.
        Neeche kisi bhi image par <b>"Set as Front"</b> dabayein.
      </p>
    </div>
  )}

  {selectedImages.length > 0 && (
    <div className="image-thumb-grid">
      {selectedImages.map((img, index) => (
        <div
          key={index}
          className={`image-thumb ${index === 0 ? "is-front" : ""}`}
        >
          <img src={img} alt="" />

          {index === 0 && (
            <span className="front-badge">⭐ FRONT</span>
          )}

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
                Kisi bhi platform (Amazon, Flipkart, Myntra...) ka product screenshot
                upload karo — AI usse specifications aur "About this item" points
                automatically nikale aur neeche ke fields bhar dega.
              </small>

              <div className="ai-extract-controls">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files[0] || null)}
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
                Amazon / Flipkart / kisi bhi store ki product link paste karo —
                info + product images dono extract hongi.
              </small>

              <div className="ai-extract-controls">
                <input
                  type="url"
                  className="ai-link-input"
                  value={extractLink}
                  onChange={(e) => setExtractLink(e.target.value)}
                  placeholder="https://www.amazon.in/... ya https://www.flipkart.com/..."
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
                  <span>👀 Extract Preview — edit karke Save karein</span>
                  <div className="ai-preview-actions">
                    <button
                      type="button"
                      className="ai-preview-apply"
                      onClick={() => {
                        applyExtractedInfo(previewDraft, extractPreview.images);
                        setExtractPreview(null);
                        setPreviewDraft(null);
                        showToast(
                          "✅ Extract result form me save ho gaya"
                        );
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
                      <img
                        key={index}
                        src={img}
                        alt={`Product ${index + 1}`}
                      />
                    ))}
                    <small>
                      {extractPreview.images.length} product image(s) mili —
                      Save par "Product Images" me add ho jayengi
                    </small>
                  </div>
                )}

                <div className="ai-preview-fields">
                  <label className="ai-edit-field">
                    <span>Brand</span>
                    <input
                      value={previewDraft.brand || ""}
                      onChange={(e) =>
                        setPreviewDraft({
                          ...previewDraft,
                          brand: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="ai-edit-field">
                    <span>Title</span>
                    <input
                      value={previewDraft.title || ""}
                      onChange={(e) =>
                        setPreviewDraft({
                          ...previewDraft,
                          title: e.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="ai-edit-row">
                    <label className="ai-edit-field">
                      <span>Price (₹)</span>
                      <input
                        type="number"
                        value={previewDraft.price || ""}
                        onChange={(e) =>
                          setPreviewDraft({
                            ...previewDraft,
                            price: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="ai-edit-field">
                      <span>MRP (₹)</span>
                      <input
                        type="number"
                        value={previewDraft.mrp || ""}
                        onChange={(e) =>
                          setPreviewDraft({
                            ...previewDraft,
                            mrp: e.target.value,
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
                      onChange={(e) =>
                        setPreviewDraft({
                          ...previewDraft,
                          description: e.target.value,
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
                        onChange={(e) => {
                          const specs = [...previewDraft.specifications];
                          specs[index] = {
                            ...specs[index],
                            label: e.target.value,
                          };
                          setPreviewDraft({ ...previewDraft, specifications: specs });
                        }}
                      />
                      <input
                        value={spec.value}
                        placeholder="Value"
                        onChange={(e) => {
                          const specs = [...previewDraft.specifications];
                          specs[index] = {
                            ...specs[index],
                            value: e.target.value,
                          };
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
                        onChange={(e) => {
                          const highlights = [...previewDraft.highlights];
                          highlights[index] = e.target.value;
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
                Amazon jaisi key-value specifications (jaise Hair Type → All, Scent →
                Rosemary, Volume → 48 ml). Ye product page par table me dikhengi.
              </small>

              {(form.specifications || []).map((spec, index) => (
                <div className="spec-row" key={index}>
                  <input
                    value={spec.label}
                    onChange={(e) => updateSpecRow(index, "label", e.target.value)}
                    placeholder="Specification (e.g. Hair Type)"
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => updateSpecRow(index, "value", e.target.value)}
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

              <button
                type="button"
                className="spec-add-btn"
                onClick={addSpecRow}
              >
                + Add specification
              </button>
            </div>

            <div className="full-field specs-editor">
              <span className="specs-editor-title">About this item (bullet points)</span>
              <small className="specs-editor-hint">
                Amazon ke "About this item" jaisa — har line ek bullet banegi. Product
                page par click karke expand/collapse ho sakti hai.
              </small>

              <textarea
                className="highlights-textarea"
                rows="4"
                placeholder={
                  "Ek line = ek bullet point:\nImproves blood circulation to the scalp\nDeeply nourishes the scalp\nStrengthens hair follicles reducing breakage"
                }
                value={(form.highlights || []).join("\n")}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    highlights: e.target.value
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
    <h2>Coupons</h2>
  </div>
  

  <table className="admin-table">
    <thead>
      <tr>
        <th>Code</th>
        <th>Type</th>
        <th>Discount</th>
        <th>Min Order</th>
        <th>Expiry</th>
        <th>Action</th>
      </tr>
    </thead>

    <tbody>
      {coupons.map((coupon) => (
        <tr key={coupon._id}>
          <td>{coupon.code}</td>
          <td>{coupon.discountType}</td>
          <td>{coupon.discountValue}</td>
          <td>₹{coupon.minimumOrder}</td>
          <td>
            {coupon.expiryDate
              ? new Date(coupon.expiryDate).toLocaleDateString()
              : "-"}
          </td>
          <td>
            <button
              className="delete-product"
              onClick={() => deleteCoupon(coupon._id)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
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
                    <th>Deal</th>
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
    product.images?.[0] ||
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
                        {product.dealType === "99" ? (
                          <span className="stock-active">₹99 Deals</span>
                        ) : product.dealType === "199" ? (
                          <span className="stock-active">₹199 Deals</span>
                        ) : (
                          <small>Regular</small>
                        )}
                      </td>

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
