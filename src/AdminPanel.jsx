import { useEffect, useMemo, useState } from "react";
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiImage,
  FiPercent,
  FiGrid,
  FiRefreshCw,
  FiLogOut,
  FiArrowLeft,
  FiPlus,
  FiBox,
  FiLayers,
  FiAlertTriangle,
  FiShoppingCart,
  FiTrash2,
  FiEdit2,
  FiX,
  FiZap,
  FiCornerUpLeft,
} from "react-icons/fi";
import "./AdminPanel.css";
import { optimizeImage } from "./utils/cloudinary";

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

const adminTabs = [
  { id: "dashboard", label: "Dashboard", icon: FiHome },
  { id: "products", label: "Products", icon: FiPackage },
  { id: "orders", label: "Orders", icon: FiShoppingBag },
  { id: "returns", label: "Returns", icon: FiCornerUpLeft },
  { id: "banners", label: "Offer Banners", icon: FiImage },
  { id: "coupons", label: "Coupons", icon: FiPercent },
  { id: "categories", label: "Categories", icon: FiGrid },
];

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
  const [returns, setReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnProcessingId, setReturnProcessingId] = useState("");
  const [reviewReturnId, setReviewReturnId] = useState(null);
  const [approveForm, setApproveForm] = useState({
    deductionAmount: "",
    refundAmount: "",
    adminNote: "",
  });
  const [rejectForm, setRejectForm] = useState({
    rejectionReason: "",
  });

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

  const [tab, setTab] = useState("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadReturns = async () => {
    try {
      setReturnsLoading(true);

      const data = await request(`${apiUrl}/api/returns`);
      setReturns(data.returns || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setReturnsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProducts();
      loadOrders();
      loadCoupons();
      loadBanners();
      loadReturns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refresh = async () => {
    if (refreshing) return;

    setRefreshing(true);

    await Promise.allSettled([
      loadProducts(),
      loadOrders(),
      loadCoupons(),
      loadBanners(),
      loadReturns(),
    ]);

    setRefreshing(false);
    showToast("Admin data refreshed");
  };

  const switchTab = (nextTab, options = {}) => {
    setTab(nextTab);

    if (options.showForm) {
      setShowProductForm(true);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setShowProductForm(true);

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
    setShowProductForm(false);
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

    showToast("Set as front image — this image will be shown on the storefront");
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
      showToast("Please choose a product screenshot first");
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
          "⚠️ No product info found in the screenshot — try a clear, close-up screenshot"
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

      showToast("✨ Extracted — review the preview below and press Save");
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
      showToast("Please paste a product link first");
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      showToast("Please paste a valid link (https://...)");
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
        `✨ Got ${(info.specifications || []).length} specs + ${
          (info.highlights || []).length
        } points + ${(data.images || []).length} images from the link — review and press Save`
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

      showToast(data.message || "Order status updated");
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

  const startReviewReturn = (item) => {
    if (reviewReturnId === item._id) {
      setReviewReturnId(null);
      return;
    }

    setReviewReturnId(item._id);
    setApproveForm({
      deductionAmount: "0",
      refundAmount: String(
        item.refundableAmount ?? Number(item.expectedAmount || 0)
      ),
      adminNote: "",
    });
    setRejectForm({ rejectionReason: "" });
  };

  const approveReturn = async (item) => {
    const deductionAmount = Number(approveForm.deductionAmount);
    const refundAmount = Number(approveForm.refundAmount);

    if (!Number.isFinite(deductionAmount) || deductionAmount < 0) {
      showToast("Deduction must be 0 or more");
      return;
    }
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      showToast("Refund amount must be greater than 0");
      return;
    }

    try {
      setReturnProcessingId(item._id);

      const data = await request(`${apiUrl}/api/returns/${item._id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deductionAmount,
          refundAmount,
          adminNote: approveForm.adminNote,
        }),
      });

      setReturns((current) =>
        current.map((r) =>
          r._id === item._id ? data.returnRequest : r
        )
      );

      setReviewReturnId(null);
      showToast("Return approved — refund email sent to the customer");
    } catch (error) {
      showToast(error.message);
    } finally {
      setReturnProcessingId("");
    }
  };

  const rejectReturn = async (item) => {
    if (!rejectForm.rejectionReason.trim()) {
      showToast("Please add a rejection reason");
      return;
    }

    try {
      setReturnProcessingId(item._id);

      const data = await request(`${apiUrl}/api/returns/${item._id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason: rejectForm.rejectionReason.trim(),
        }),
      });

      setReturns((current) =>
        current.map((r) =>
          r._id === item._id ? data.returnRequest : r
        )
      );

      setReviewReturnId(null);
      showToast("Return rejected — the customer has been notified");
    } catch (error) {
      showToast(error.message);
    } finally {
      setReturnProcessingId("");
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
          <div className="admin-login-logo">
            <span className="admin-login-bolt">⚡</span>
            DEALROOT
          </div>

          <button type="button" className="admin-back" onClick={onBack}>
            <FiArrowLeft /> Store
          </button>

          <p>DEALROOT BEAUTY · SECURE ACCESS</p>
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

          <button className="admin-login-btn" disabled={loggingIn}>
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

  const pendingReturns = returns.filter(
    (item) => item.status === "pending"
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) > 0 && Number(product.stock) <= 5
  ).length;

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const currentTab = adminTabs.find((item) => item.id === tab) || adminTabs[0];

  const statCards = [
    {
      label: "Total products",
      value: products.length,
      sub: "Live in store",
      icon: FiBox,
      tone: "blue",
    },
    {
      label: "Total stock",
      value: totalStock,
      sub: "Units across all products",
      icon: FiLayers,
      tone: "green",
    },
    {
      label: "Out of stock",
      value: outOfStock,
      sub: lowStock > 0 ? `${lowStock} low stock (≤5)` : "All stocked",
      icon: FiAlertTriangle,
      tone: "red",
    },
    {
      label: "Pending orders",
      value: pendingOrders,
      sub: "Awaiting fulfilment",
      icon: FiShoppingCart,
      tone: "pink",
    },
    {
      label: "Pending returns",
      value: pendingReturns,
      sub: "Awaiting your review",
      icon: FiCornerUpLeft,
      tone: "amber",
    },
  ];

  const quickActions = [
    {
      label: "Add product",
      desc: "Upload a new product",
      icon: FiPlus,
      tone: "pink",
      onClick: () => {
        cancelEdit();
        switchTab("products", { showForm: true });
      },
    },
    {
      label: "Manage orders",
      desc: `${orders.length} orders total`,
      icon: FiShoppingBag,
      tone: "blue",
      onClick: () => switchTab("orders"),
    },
    {
      label: "Offer banner",
      desc: "Create a home page banner",
      icon: FiImage,
      tone: "purple",
      onClick: () => switchTab("banners"),
    },
    {
      label: "Create coupon",
      desc: "Create a discount coupon",
      icon: FiPercent,
      tone: "green",
      onClick: () => switchTab("coupons"),
    },
    {
      label: "Add category",
      desc: "Create a new category",
      icon: FiGrid,
      tone: "amber",
      onClick: () => switchTab("categories"),
    },
    {
      label: "Review returns",
      desc: `${pendingReturns} request(s) pending`, 
      icon: FiCornerUpLeft,
      tone: "pink",
      onClick: () => switchTab("returns"),
    },
  ];

  const statusBadge = (status = "placed") => {
    const map = {
      placed: "status-placed",
      confirmed: "status-confirmed",
      packed: "status-packed",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };

    return map[status] || "status-placed";
  };

  return (
    <div className="admin-shell">
      {/* ===================== SIDEBAR (desktop) ===================== */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-brand-bolt">⚡</span>
          <div>
            <b>DEALROOT</b>
            <small>Beauty Admin</small>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {adminTabs.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-item ${
                  tab === item.id ? "active" : ""
                }`}
                onClick={() => switchTab(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
                {(item.id === "orders" && pendingOrders > 0) ||
                (item.id === "returns" && pendingReturns > 0) ? (
                  <em className="admin-nav-badge">
                    {item.id === "orders" ? pendingOrders : pendingReturns}
                  </em>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-foot">
          <button type="button" className="admin-foot-btn" onClick={onBack}>
            <FiArrowLeft /> Back to store
          </button>
          <button type="button" className="admin-foot-btn" onClick={() => logOut()}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* ===================== MAIN AREA ===================== */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <p>DEALROOT BEAUTY · ADMIN</p>
            <h1>
              <currentTab.icon className="admin-topbar-icon" />
              {currentTab.label}
            </h1>
          </div>

          <div className="admin-topbar-actions">
            <button
              className={`admin-refresh ${refreshing ? "refreshing" : ""}`}
              onClick={refresh}
              disabled={refreshing}
            >
              <FiRefreshCw className="admin-refresh-icon" />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>

            <button className="admin-back" onClick={() => logOut()}>
              <FiLogOut /> Logout
            </button>
          </div>
        </header>

        {/* Mobile / tablet pill navigation */}
        <nav className="admin-pillnav">
          {adminTabs.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`admin-pill ${tab === item.id ? "active" : ""}`}
                onClick={() => switchTab(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
                {(item.id === "orders" && pendingOrders > 0) ||
                (item.id === "returns" && pendingReturns > 0) ? (
                  <em className="admin-nav-badge">
                    {item.id === "orders" ? pendingOrders : pendingReturns}
                  </em>
                ) : null}
              </button>
            );
          })}
        </nav>

        <main className="admin-content">
          {/* ===================== DASHBOARD ===================== */}
          {tab === "dashboard" && (
            <div className="admin-dash">
              <section className="admin-welcome">
                <div>
                  <p className="admin-welcome-date">{todayLabel}</p>
                  <h2>Welcome Harsh 👋</h2>
                  <span>
                    See your store at a glance — add new products, manage
                    orders, or run marketing campaigns.
                  </span>
                </div>

                <div className="admin-welcome-actions">
                  <button
                    className="admin-primary-btn"
                    type="button"
                    onClick={() => switchTab("products", { showForm: true })}
                  >
                    <FiPlus /> Add product
                  </button>
                  <button
                    className="admin-ghost-btn"
                    type="button"
                    onClick={() => switchTab("orders")}
                  >
                    <FiShoppingBag /> View orders
                  </button>
                </div>
              </section>

              <section className="admin-stats">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  const openStatTab = () => {
                    if (stat.label === "Pending orders") {
                      return switchTab("orders");
                    }
                    if (stat.label === "Pending returns") {
                      return switchTab("returns");
                    }
                    return switchTab("products");
                  };

                  return (
                    <article
                      className="admin-stat"
                      key={stat.label}
                      role="button"
                      tabIndex={0}
                      onClick={openStatTab}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openStatTab();
                        }
                      }}
                    >
                      <div className={`admin-stat-chip chip-${stat.tone}`}>
                        <Icon />
                      </div>
                      <div className="admin-stat-meta">
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                        <small>{stat.sub}</small>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="admin-quick">
                <div className="admin-card-head">
                  <h3>
                    <FiZap className="head-icon" /> Quick actions
                  </h3>
                  <span>Most common tasks — in one click</span>
                </div>

                <div className="admin-quick-grid">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.label}
                        type="button"
                        className="admin-quick-card"
                        onClick={action.onClick}
                      >
                        <span className={`qa-icon qa-${action.tone}`}>
                          <Icon />
                        </span>
                        <b>{action.label}</b>
                        <small>{action.desc}</small>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="admin-dash-grid">
                <section className="admin-card">
                  <div className="admin-card-head">
                    <h3>
                      <FiPackage className="head-icon" /> Recent products
                    </h3>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => switchTab("products")}
                    >
                      View all →
                    </button>
                  </div>

                  {loading ? (
                    <div className="admin-empty">Loading products...</div>
                  ) : products.length === 0 ? (
                    <div className="admin-empty">No products yet.</div>
                  ) : (
                    <div className="admin-dash-list">
                      {products.slice(0, 5).map((product) => (
                        <div className="admin-dash-row" key={product._id}>
                          <img
                            src={
                              optimizeImage(product.images?.[0], 120) ||
                              "https://placehold.co/80x80?text=Product"
                            }
                            alt={product.title}
                          />
                          <div className="adr-main">
                            <b>{product.title}</b>
                            <small>{product.brand}</small>
                          </div>
                          <div className="adr-side">
                            <b>₹{product.price}</b>
                            <span
                              className={
                                Number(product.stock) > 0
                                  ? "stock-active"
                                  : "stock-empty"
                              }
                            >
                              {Number(product.stock) > 0
                                ? `${product.stock} in stock`
                                : "Out of stock"}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="admin-row-edit"
                            onClick={() => {
                              switchTab("products");
                              startEdit(product);
                            }}
                            title="Edit product"
                          >
                            <FiEdit2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="admin-card">
                  <div className="admin-card-head">
                    <h3>
                      <FiShoppingBag className="head-icon" /> Recent orders
                    </h3>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => switchTab("orders")}
                    >
                      View all →
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="admin-empty">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="admin-empty">No orders placed yet.</div>
                  ) : (
                    <div className="admin-dash-list">
                      {orders.slice(0, 5).map((order) => (
                        <div className="admin-dash-row" key={order._id}>
                          <div className="adr-main">
                            <b>{order.orderNumber}</b>
                            <small>{order.customer?.name}</small>
                          </div>
                          <div className="adr-side">
                            <b>₹{order.totalAmount}</b>
                            <span className={`order-badge ${statusBadge(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* ===================== PRODUCTS ===================== */}
          {tab === "products" && (
            <div className="admin-tab-page">
              <section className="admin-tab-head">
                <div>
                  <p>LIVE INVENTORY</p>
                  <h2>Manage your products</h2>
                </div>

                <div className="admin-tab-head-actions">
                  <input
                    className="admin-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..."
                  />
                  <button
                    type="button"
                    className="admin-primary-btn"
                    onClick={() => {
                      cancelEdit();
                      switchTab("products", { showForm: true });
                    }}
                  >
                    <FiPlus /> Add product
                  </button>
                </div>
              </section>

              {showProductForm && (
                <section className="admin-form-card admin-product-form-card">
                  <div className="admin-section-title">
                    <div>
                      <p>{editingId ? "EDIT PRODUCT" : "NEW PRODUCT"}</p>
                      <h2>
                        {editingId
                          ? "Update product details"
                          : "Add a product to DEALROOT"}
                      </h2>
                    </div>

                    <button
                      className="cancel-edit"
                      type="button"
                      onClick={cancelEdit}
                    >
                      <FiX /> Close form
                    </button>
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
                            <b>First image = front/cover.</b> This is the image shown on the
                            storefront — it appears first in the products list, flash deals
                            and the product page. Click <b>"Set as Front"</b> on any image below.
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
                        Upload a product screenshot from any platform (Amazon, Flipkart,
                        Myntra...) — the AI will automatically extract specifications and
                        "About this item" points and fill the fields below.
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
                        Paste a product link from Amazon / Flipkart / any store —
                        both info and product images will be extracted.
                      </small>

                      <div className="ai-extract-controls">
                        <input
                          type="url"
                          className="ai-link-input"
                          value={extractLink}
                          onChange={(e) => setExtractLink(e.target.value)}
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
                                showToast(
                                  "✅ Extract result saved to the form"
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
                              {extractPreview.images.length} product image(s) found —
                              they will be added to "Product Images" on Save
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
                        Amazon-style key-value specifications (e.g. Hair Type → All, Scent →
                        Rosemary, Volume → 48 ml). These will be shown as a table on the product page.
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
                        Like Amazon's "About this item" — each line becomes a bullet point.
                        They can be expanded/collapsed by clicking on the product page.
                      </small>

                      <textarea
                        className="highlights-textarea"
                        rows="4"
                        placeholder={
                          "One line = one bullet point:\nImproves blood circulation to the scalp\nDeeply nourishes the scalp\nStrengthens hair follicles reducing breakage"
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

                    <div className="product-form-actions">
                      <button className="save-product" disabled={saving}>
                        {saving
                          ? "Saving..."
                          : editingId
                            ? "Save changes"
                            : "Add product"}
                      </button>

                      {editingId && (
                        <button
                          type="button"
                          className="cancel-edit"
                          onClick={cancelEdit}
                        >
                          Cancel edit
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              )}

              <section className="admin-products-card">
                <div className="admin-section-title">
                  <div>
                    <p>LIVE INVENTORY</p>
                    <h2>All products ({visibleProducts.length})</h2>
                  </div>
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
                            <td data-label="Product">
                              <div className="admin-product-name">
                                <img
                                  src={
                                    optimizeImage(product.images?.[0], 120) ||
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

                            <td data-label="Category">{product.category}</td>

                            <td data-label="Deal">
                              {product.dealType === "99" ? (
                                <span className="stock-active">₹99 Deals</span>
                              ) : product.dealType === "199" ? (
                                <span className="stock-active">₹199 Deals</span>
                              ) : (
                                <small>Regular</small>
                              )}
                            </td>

                            <td data-label="Price">
                              <b>₹{product.price}</b>
                              <small>MRP ₹{product.mrp}</small>
                            </td>

                            <td data-label="Stock">
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

                            <td data-label="Status">
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

                            <td data-label="Actions">
                              <div className="admin-actions">
                                <button type="button" onClick={() => startEdit(product)}>
                                  <FiEdit2 /> Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() => deleteProduct(product)}
                                >
                                  <FiTrash2 /> Delete
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
            </div>
          )}

          {/* ===================== ORDERS ===================== */}
          {tab === "orders" && (
            <div className="admin-tab-page">
              <section className="admin-tab-head">
                <div>
                  <p>CUSTOMER ORDERS</p>
                  <h2>Manage COD orders</h2>
                </div>

                <button className="admin-refresh" onClick={loadOrders}>
                  <FiRefreshCw /> Refresh orders
                </button>
              </section>

              <section className="admin-products-card">
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
                            <td data-label="Order">
                              <b>{order.orderNumber}</b>
                              <small>
                                {new Date(order.createdAt).toLocaleString("en-IN")}
                              </small>
                            </td>

                            <td data-label="Customer">
                              <b>{order.customer?.name}</b>
                              <small>{order.customer?.phone}</small>
                              <small>
                                {order.customer?.address}, {order.customer?.city} -{" "}
                                {order.customer?.pincode}
                              </small>
                            </td>

                            <td data-label="Items">
                              {order.items?.map((item) => (
                                <small key={item._id || item.product}>
                                  {item.title} × {item.quantity} — ₹{item.subtotal}
                                </small>
                              ))}
                            </td>

                            <td data-label="Amount">
                              <b>₹{order.totalAmount}</b>
                              {Number(order.deliveryFee) > 0 && (
                                <small>Delivery: ₹{order.deliveryFee}</small>
                              )}
                            </td>

                            <td data-label="Payment">
                              <b>Cash on Delivery</b>
                              <small>
                                {order.paymentStatus === "paid"
                                  ? "Paid"
                                  : "Payment pending"}
                              </small>
                            </td>

                            <td data-label="Action">
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
            </div>
          )}

          {/* ===================== RETURNS ===================== */}
          {tab === "returns" && (
            <div className="admin-tab-page">
              <section className="admin-tab-head">
                <div>
                  <p>RETURNS & REFUNDS</p>
                  <h2>Review return / refund requests</h2>
                </div>

                <button className="admin-refresh" onClick={loadReturns}>
                  <FiRefreshCw /> Refresh returns
                </button>
              </section>

              <section className="admin-products-card">
                {returnsLoading ? (
                  <div className="admin-empty">Loading returns...</div>
                ) : returns.length === 0 ? (
                  <div className="admin-empty">
                    No return requests yet — customers can file a return
                    within 7 days of delivery.
                  </div>
                ) : (
                  <div className="returns-list">
                    {returns.map((item) => {
                      const customer = item.order?.customer;
                      const isPending = item.status === "pending";
                      const reviewing = reviewReturnId === item._id;

                      return (
                        <article
                          className={`return-card ${
                            isPending ? "is-pending" : ""
                          }`}
                          key={item._id}
                        >
                          <header className="return-card-head">
                            <div>
                              <b>Order {item.orderNumber}</b>
                              <small>
                                Requested{" "}
                                {new Date(
                                  item.requestedAt
                                ).toLocaleString("en-IN")}
                              </small>
                            </div>
                            <span
                              className={`return-badge return-badge-${item.status}`}
                            >
                              {item.status === "pending"
                                ? "Pending review"
                                : item.status === "approved"
                                ? `Approved · ₹${item.refundAmount}`
                                : "Rejected"}
                            </span>
                          </header>

                          <div className="return-card-body">
                            <div className="return-meta-grid">
                              <div>
                                <span>Customer</span>
                                <b>
                                  {customer?.name || "—"}{" "}
                                  {customer?.phone
                                    ? `(${customer.phone})`
                                    : ""}
                                </b>
                              </div>
                              <div>
                                <span>Reason</span>
                                <b>{item.reason}</b>
                              </div>
                              <div>
                                <span>Description</span>
                                <b>{item.description || "—"}</b>
                              </div>
                              <div>
                                <span>Order total</span>
                                <b>₹{item.expectedAmount || 0}</b>
                              </div>
                              <div>
                                <span>Shipping fee (non-refundable)</span>
                                <b>-₹{item.shippingFee || 0}</b>
                              </div>
                              <div>
                                <span>Refundable after approval</span>
                                <b>
                                  ₹
                                  {item.refundableAmount ??
                                    Number(item.expectedAmount || 0)}
                                </b>
                              </div>
                              <div>
                                <span>Refund method (UPI)</span>
                                <b>{item.upiId || "—"}</b>
                              </div>
                              {item.status === "approved" && (
                                <div>
                                  <span>Deduction / Refunded</span>
                                  <b>
                                    -₹{item.deductionAmount || 0} / ₹
                                    {item.refundAmount || 0}
                                  </b>
                                </div>
                              )}
                              {item.status === "rejected" && (
                                <div>
                                  <span>Rejection reason</span>
                                  <b>{item.rejectionReason || "—"}</b>
                                </div>
                              )}
                            </div>

                            {item.items?.length > 0 && (
                              <div className="return-items">
                                {item.items.map((it, i) => (
                                  <small key={i}>
                                    {it.title} × {it.quantity} — ₹
                                    {it.price}
                                  </small>
                                ))}
                              </div>
                            )}

                            {(item.images?.length > 0 || item.video) && (
                              <div className="return-media">
                                {item.images.map((img, i) => (
                                  <a
                                    key={i}
                                    href={img}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open photo"
                                  >
                                    <img src={img} alt="Return proof" />
                                  </a>
                                ))}
                                {item.video && (
                                  <a
                                    className="return-video-link"
                                    href={item.video}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    🎬 View video
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {isPending && (
                            <footer className="return-card-actions">
                              {!reviewing ? (
                                <button
                                  type="button"
                                  className="admin-primary-btn"
                                  onClick={() => startReviewReturn(item)}
                                >
                                  Review request
                                </button>
                              ) : (
                                <>
                                  <div className="return-review-box">
                                    <div className="return-review-title">
                                      <b>✓ Approve refund</b>
                                      <button
                                        type="button"
                                        className="return-cancel-review"
                                        onClick={() => setReviewReturnId(null)}
                                      >
                                        Close review
                                      </button>
                                    </div>
                                    <div className="return-review-grid">
                                      <label>
                                        Deduction (₹)
                                        <input
                                          type="number"
                                          min="0"
                                          value={approveForm.deductionAmount}
                                          onChange={(e) =>
                                            setApproveForm({
                                              ...approveForm,
                                              deductionAmount: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                      <label>
                                        Amount to be refunded (₹)
                                        <input
                                          type="number"
                                          min="1"
                                          value={approveForm.refundAmount}
                                          onChange={(e) =>
                                            setApproveForm({
                                              ...approveForm,
                                              refundAmount: e.target.value,
                                            })
                                          }
                                        />
                                      </label>
                                    </div>
                                    <label className="return-note-field">
                                      Note to customer (optional)
                                      <input
                                        value={approveForm.adminNote}
                                        onChange={(e) =>
                                          setApproveForm({
                                            ...approveForm,
                                            adminNote: e.target.value,
                                          })
                                        }
                                        placeholder="e.g. ₹20 deducted for damaged packaging"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="return-approve-btn"
                                      disabled={
                                        returnProcessingId === item._id
                                      }
                                      onClick={() => approveReturn(item)}
                                    >
                                      {returnProcessingId === item._id
                                        ? "Approving..."
                                        : "✓ Approve & send refund email"}
                                    </button>
                                  </div>

                                  <div className="return-reject-box">
                                    <b>✕ Reject request</b>
                                    <label>
                                      Rejection reason *
                                      <input
                                        value={rejectForm.rejectionReason}
                                        onChange={(e) =>
                                          setRejectForm({
                                            rejectionReason: e.target.value,
                                          })
                                        }
                                        placeholder="e.g. Return window expired"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="return-reject-btn"
                                      disabled={
                                        returnProcessingId === item._id
                                      }
                                      onClick={() => rejectReturn(item)}
                                    >
                                      {returnProcessingId === item._id
                                        ? "Rejecting..."
                                        : "✕ Reject & notify customer"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </footer>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ===================== BANNERS ===================== */}
          {tab === "banners" && (
            <div className="admin-tab-page">
              <section className="admin-tab-head">
                <div>
                  <p>MARKETING</p>
                  <h2>Offer Banner</h2>
                </div>
              </section>

              <section className="admin-form-card">
                <div className="banner-size-hint">
                  📐 <b>Recommended banner size: 1080 × 1080 px</b> (square)
                  <br />
                  A square image looks best. 800 × 800 or 1024 × 1024 also works.
                  Keep the text in the centre of the banner so it doesn't get cropped.
                </div>

                <form className="admin-mini-form" onSubmit={saveBanner}>
                  <label className="full-field">
                    Banner Image

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadBannerImage(e.target.files[0])}
                    />

                    {uploadingBanner && <small>Uploading banner...</small>}

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
                      placeholder="e.g. /product/6a699b... or https://yoursite.com/..."
                    />
                    <small>
                      Clicking the banner will take customers to this link. If left empty,
                      it scrolls to the products section. For an in-app page use <b>/product/...</b>,
                      for an external link paste <b>https://...</b>.
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
                    Active Banner (shown on the home page)
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
                            <td data-label="Image">
                              <img
                                src={banner.image}
                                alt=""
                                style={{
                                  width: 120,
                                  borderRadius: 8,
                                }}
                              />
                            </td>

                            <td data-label="Redirect Link">
                              <b>{banner.buttonLink || "Products"}</b>
                              <br />
                              <small>
                                {banner.buttonLink
                                  ? banner.buttonLink.startsWith("http")
                                    ? "External link (opens in a new tab)"
                                    : "App page"
                                  : "Default — products section"}
                              </small>
                            </td>

                            <td data-label="Status">
                              {banner.active ? (
                                <span className="stock-active">Active</span>
                              ) : (
                                <span className="stock-empty">Inactive</span>
                              )}
                            </td>

                            <td data-label="Actions">
                              <div className="admin-actions">
                                <button onClick={() => editBanner(banner)}>
                                  <FiEdit2 /> Edit
                                </button>

                                <button
                                  className="delete-button"
                                  onClick={() => deleteBanner(banner._id)}
                                >
                                  <FiTrash2 /> Delete
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
            </div>
          )}

          {/* ===================== COUPONS ===================== */}
          {tab === "coupons" && (
            <div className="admin-tab-page">
              <section className="admin-tab-head">
                <div>
                  <p>COUPON MANAGEMENT</p>
                  <h2>Create Discount Coupon</h2>
                </div>
              </section>

              <section className="admin-form-card">
                <form className="admin-mini-form" onSubmit={createCoupon}>
                  <label>
                    Coupon Code
                    <input
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>

                  <label>
                    Discount Type
                    <select
                      value={couponForm.discountType}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          discountType: e.target.value,
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
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          discountValue: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Minimum Order
                    <input
                      type="number"
                      value={couponForm.minimumOrder}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          minimumOrder: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Maximum Discount
                    <input
                      type="number"
                      value={couponForm.maximumDiscount}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          maximumDiscount: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Expiry Date
                    <input
                      type="date"
                      value={couponForm.expiryDate}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          expiryDate: e.target.value,
                        })
                      }
                    />
                  </label>

                  <button className="save-product">Create Coupon</button>
                </form>
              </section>

              <section className="admin-products-card">
                <div className="admin-section-title">
                  <div>
                    <p>LIVE COUPONS</p>
                    <h2>All coupons ({coupons.length})</h2>
                  </div>
                </div>

                {coupons.length === 0 ? (
                  <div className="admin-empty">No coupons created yet.</div>
                ) : (
                  <div className="admin-table-wrap">
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
                            <td data-label="Code">
                              <span className="coupon-code">{coupon.code}</span>
                            </td>
                            <td data-label="Type">{coupon.discountType}</td>
                            <td data-label="Discount">{coupon.discountValue}</td>
                            <td data-label="Min Order">₹{coupon.minimumOrder}</td>
                            <td data-label="Expiry">
                              {coupon.expiryDate
                                ? new Date(coupon.expiryDate).toLocaleDateString()
                                : "-"}
                            </td>
                            <td data-label="Action">
                              <div className="admin-actions">
                                <button
                                  className="delete-button"
                                  onClick={() => deleteCoupon(coupon._id)}
                                >
                                  <FiTrash2 /> Delete
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
            </div>
          )}

          {/* ===================== CATEGORIES ===================== */}
          {tab === "categories" && (
            <div className="admin-tab-page">
              <section className="admin-tab-head">
                <div>
                  <p>CATEGORY MANAGEMENT</p>
                  <h2>Add / Remove Store Categories</h2>
                </div>
              </section>

              <section className="admin-form-card">
                <form
                  className="admin-mini-form"
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
                      <FiPlus /> Add Category
                    </button>
                    <small style={{ display: "block", marginTop: 8 }}>
                      New categories appear immediately in the "Shop by Category"
                      section on the home page and in this product form's dropdown.
                      Storage: saved in this browser.
                    </small>
                  </div>
                </form>
              </section>

              <section className="admin-products-card">
                <div className="admin-section-title">
                  <div>
                    <p>ALL CATEGORIES</p>
                    <h2>Store categories ({categories.length})</h2>
                  </div>
                </div>

                {categories.length === 0 ? (
                  <div className="admin-empty">No categories yet.</div>
                ) : (
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
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
