// Verified customer account modal connection — 23 July 2026
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import { FiHome, FiGrid, FiZap, FiPackage, FiUser } from "react-icons/fi";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import ShippingPolicy from "./pages/ShippingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ProductDetails from "./pages/ProductDetails";
import Footer from "./components/Footer";
import { useCallback, useEffect, useMemo, useState } from "react";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";
import CheckoutModal from "./CheckoutModal";
import AdminPanel from "./AdminPanel";
import AccountModal from "./AccountModal";
import "./index.css";
import {
  getStoredCategories,
  saveStoredCategories,
} from "./utils/categories";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fallbackImage =
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=700&q=85";

function App() {
  const [isAdminPage, setIsAdminPage] = useState(
    window.location.hash === "#admin"
  );

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDeal, setActiveDeal] = useState("none");
  const [bestsellersOnly, setBestsellersOnly] = useState(false);
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [banners, setBanners] = useState([]);

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [categories, setCategories] = useState(getStoredCategories);
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userToken, setUserToken] = useState(() =>
    localStorage.getItem("dealroot_user_token") || ""
  );
  const [user, setUser] = useState(null);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const openAdmin = () => {
    window.location.hash = "admin";
    setIsAdminPage(true);
  };

  const closeAdmin = () => {
    window.location.hash = "";
    setIsAdminPage(false);
  };

  const logOutCustomer = () => {
    localStorage.removeItem("dealroot_user_token");
    localStorage.removeItem("dealroot_user");
    localStorage.removeItem("dealroot_cart");
    localStorage.removeItem("dealroot_checkout_details");
    setUserToken("");
    setUser(null);
    setCart([]);
    setWishlist([]);
    setCartOpen(false);
    setWishlistOpen(false);
    setCheckoutOpen(false);
    showToast("You have been logged out");
  };

  const saveCustomerAuth = (token, nextUser) => {
    localStorage.setItem("dealroot_user_token", token);
    setUserToken(token);
    setUser(nextUser);
  };

  useEffect(() => {
    if (!userToken) return;

    const restoreCustomer = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error();
        setUser(data.user);
      } catch {
        localStorage.removeItem("dealroot_user_token");
        localStorage.removeItem("dealroot_user");
        localStorage.removeItem("dealroot_cart");
        localStorage.removeItem("dealroot_checkout_details");
        setUserToken("");
        setUser(null);
        setCart([]);
        setCartOpen(false);
        setCheckoutOpen(false);
      }
    };

    restoreCustomer();
  }, [userToken]);

  const loadBanner = async () => {
  try {
    const response = await fetch(`${API_URL}/api/banners/active`);
    const data = await response.json();

    if (response.ok && data.success) {
      setBanners(data.banners || (data.banner ? [data.banner] : []));
    } else {
      setBanners([]);
    }
  } catch {
    setBanners([]);
  }
};

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");

      const params = new URLSearchParams();

      if (activeCategory !== "All") {
        params.set("category", activeCategory);
      }

      if (activeDeal !== "none") {
        params.set("dealType", activeDeal);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();
      const response = await fetch(
        `${API_URL}/api/products${query ? `?${query}` : ""}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Products could not be loaded");
      }

      setProducts(
        (data.products || []).map((product) => ({
          id: product._id,
          brand: product.brand,
          name: product.title,
          category: product.category,
          price: product.price,
          originalPrice: product.mrp,
          rating: product.rating,
          reviews: Number(product.reviews || 0).toLocaleString("en-IN"),
          badge: product.badge || "",
          dealType: product.dealType || "none",
          image: product.images?.[0] || product.image || fallbackImage,
          stock: product.stock,
          createdAt: product.createdAt || "",
          marketplaceLinks: Array.isArray(product.marketplaceLinks)
            ? product.marketplaceLinks.filter(
                (link) => link?.platform && link?.url
              )
            : [],
        }))
      );
    } catch {
      setProducts([]);
      setProductsError(
        "Could not load products. Please make sure the backend server is running."
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [activeCategory, activeDeal, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 300);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
  loadBanner();
}, []);

  const filteredProducts = useMemo(() => {
    if (bestsellersOnly) {
      return products.filter(
        (product) =>
          Number(product.price) < 200 &&
          Number.isFinite(Number(product.price))
      );
    }

    if (newArrivalsOnly) {
      return [...products].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    return products;
  }, [products, bestsellersOnly, newArrivalsOnly]);

  const showCategory = (category) => {
    setBestsellersOnly(false);
    setNewArrivalsOnly(false);
    setActiveDeal("none");
    setActiveCategory(category);
  };

  const showDeal = (dealType) => {
    setBestsellersOnly(false);
    setNewArrivalsOnly(false);
    setActiveCategory("All");
    setActiveDeal(dealType);

    window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const showAllProducts = () => {
    setBestsellersOnly(false);
    setNewArrivalsOnly(false);
    setActiveDeal("none");
    setActiveCategory("All");
  };

  const showBestsellers = () => {
    setBestsellersOnly(true);
    setNewArrivalsOnly(false);
    setActiveDeal("none");
    setActiveCategory("All");

    window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const showNewArrivals = () => {
    setNewArrivalsOnly(true);
    setBestsellersOnly(false);
    setActiveDeal("none");
    setActiveCategory("All");

    window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const addToCart = (product, quantity = 1) => {
  const qty = Math.max(1, Number(quantity) || 1);

  if (product.stock <= 0) {
    showToast("This product is currently out of stock");
    return;
  }

  setCart((currentCart) => {
    const existing = currentCart.find(
      (item) => item.id === product.id
    );

    if (existing) {
      const nextQuantity = existing.quantity + qty;

      if (nextQuantity > product.stock) {
        showToast(`Only ${product.stock} item(s) available`);

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: product.stock }
            : item
        );
      }

      return currentCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: nextQuantity }
          : item
      );
    }

    return [
      ...currentCart,
      {
        ...product,
        quantity: Math.min(qty, product.stock),
      },
    ];
  });

  showToast(`${product.name} added to cart`);
};

  const toggleWishlist = (product) => {
    if (!user) {
      showToast("Please sign in first to save items to your wishlist");
      setAccountOpen(true);
      return;
    }

    setWishlist((currentWishlist) => {
      const exists = currentWishlist.some((item) => item.id === product.id);
      showToast(exists ? "Removed from wishlist" : "Saved to wishlist");

      return exists
        ? currentWishlist.filter((item) => item.id !== product.id)
        : [...currentWishlist, { ...product }];
    });
  };

  const removeFromWishlist = (id) => {
    setWishlist((current) => current.filter((item) => item.id !== id));
  };

  const openWishlist = () => {
    if (!user) {
      showToast("Please sign in first to view your wishlist");
      setAccountOpen(true);
      return;
    }
    setCartOpen(false);
    setWishlistOpen(true);
  };

  const wishlistProducts = wishlist;

  const addCategory = (name, emoji, color) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Category "${cleanName}" already exists`);
      return;
    }

    const next = [
      ...categories,
      { name: cleanName, emoji: emoji.trim() || "✨", color: color || "#f5f5f5" },
    ];
    setCategories(next);
    saveStoredCategories(next);
    showToast(`Category "${cleanName}" added`);
  };

  const removeCategory = (name) => {
    const next = categories.filter((c) => c.name !== name);
    setCategories(next);
    saveStoredCategories(next);
    showToast(`Category "${name}" removed`);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartDelivery = cartSubtotal === 0 || cartSubtotal >= 499 ? 0 : 49;
  const cartTotal = cartSubtotal + cartDelivery;

  if (isAdminPage) {
    return (
      <AdminPanel
        apiUrl={API_URL}
        onBack={closeAdmin}
        showToast={showToast}
        categories={categories}
        onAddCategory={addCategory}
        onRemoveCategory={removeCategory}
      />
    );
  }

  return (
    <div className="app-shell">
      {toast && <div className="toast">✓ {toast}</div>}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        setCart={setCart}
        showToast={showToast}
        onCheckout={() => {
          if (!cart.length) {
            showToast("Your cart is empty");
            return;
          }
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={wishlistProducts}
        onRemove={removeFromWishlist}
        addToCart={addToCart}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        total={cartTotal}
        showToast={showToast}
        apiUrl={API_URL}
        user={user}
        userToken={userToken}
        onProfileUpdated={setUser}
        onOrderPlaced={() => {
          setCart([]);
          loadProducts();
        }}
      />

      <AccountModal
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        apiUrl={API_URL}
        user={user}
        token={userToken}
        onAuth={saveCustomerAuth}
        onLogout={logOutCustomer}
        onUserUpdated={setUser}
        showToast={showToast}
      />

<Navbar
  search={search}
  setSearch={setSearch}
  openAdmin={openAdmin}
  user={user}
  wishlist={wishlist}
  cartCount={cartCount}
  setAccountOpen={setAccountOpen}
  setCartOpen={setCartOpen}
  openWishlist={openWishlist}
  showBestsellers={showBestsellers}
  showAllProducts={showAllProducts}
  showNewArrivals={showNewArrivals}
/>

<Routes>
  <Route
    path="/"
    element={
      <Home
        fallbackImage={fallbackImage}
        showAllProducts={showAllProducts}
        activeCategory={activeCategory}
        activeDeal={activeDeal}
        bestsellersOnly={bestsellersOnly}
        newArrivalsOnly={newArrivalsOnly}
        categories={categories}
        showCategory={showCategory}
        showDeal={showDeal}
        loadingProducts={loadingProducts}
        productsError={productsError}
        loadProducts={loadProducts}
        filteredProducts={filteredProducts}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        addToCart={addToCart}
        banners={banners}
      />
    }
  />

  <Route path="/contact" element={<Contact />} />
  <Route path="/privacy" element={<PrivacyPolicy />} />
  <Route path="/terms" element={<Terms />} />
  <Route path="/shipping" element={<ShippingPolicy />} />
  <Route path="/refund" element={<RefundPolicy />} />
  <Route
  path="/product/:id"
  element={
    <ProductDetails
      apiUrl={API_URL}
      addToCart={addToCart}
      toggleWishlist={toggleWishlist}
      wishlist={wishlist}
      fallbackImage={fallbackImage}
      showToast={showToast}
      user={user}
    />
  }
/>  
</Routes>
<Footer />

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-nav-items">
          <a href="#top" className="mobile-nav-item active">
            <FiHome />
            <span className="mn-label">Home</span>
          </a>
          <a href="#categories" className="mobile-nav-item">
            <FiGrid />
            <span className="mn-label">Categories</span>
          </a>
          <a href="#price-deals" className="mobile-nav-item">
            <FiZap />
            <span className="mn-label">Deals</span>
          </a>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => setAccountOpen(true)}
          >
            <FiPackage />
            <span className="mn-label">Orders</span>
          </button>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => setAccountOpen(true)}
          >
            <FiUser />
            <span className="mn-label">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
