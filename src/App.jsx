// Verified customer account modal connection — 23 July 2026
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import ShippingPolicy from "./pages/ShippingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ProductDetails from "./pages/ProductDetails";
import Footer from "./components/Footer";
import { useEffect, useMemo, useState } from "react";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import AdminPanel from "./AdminPanel";
import AccountModal from "./AccountModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const categories = [
  { name: "Makeup", emoji: "💄", color: "#FFE4EC" },
  { name: "Skincare", emoji: "✨", color: "#E4F3FF" },
  { name: "Haircare", label: "Hair Care", emoji: "🧴", color: "#FFF1D8" },
  { name: "Fragrance", emoji: "🌸", color: "#EEE9FF" },
  { name: "Bath & Body", emoji: "🫧", color: "#E2F8F0" },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=700&q=85";

function App() {
  const [isAdminPage, setIsAdminPage] = useState(
    window.location.hash === "#admin"
  );

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDeal, setActiveDeal] = useState("none");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
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
    setCartOpen(false);
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

  const loadProducts = async () => {
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
          image: product.image || fallbackImage,
          stock: product.stock,
          marketplaceLinks: Array.isArray(product.marketplaceLinks)
            ? product.marketplaceLinks.filter(
                (link) => link?.platform && link?.url
              )
            : [],
        }))
      );
    } catch (error) {
      setProducts([]);
      setProductsError(
        "Could not load products. Please make sure the backend server is running."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 300);
    return () => window.clearTimeout(timer);
  }, [activeCategory, activeDeal, search]);

  const filteredProducts = useMemo(() => products, [products]);

  const showCategory = (category) => {
    setActiveDeal("none");
    setActiveCategory(category);
  };

  const showDeal = (dealType) => {
    setActiveCategory("All");
    setActiveDeal(dealType);

    window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const showAllProducts = () => {
    setActiveDeal("none");
    setActiveCategory("All");
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast("This product is currently out of stock");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Only ${product.stock} item(s) available`);
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    showToast(`${product.name} added to cart`);
  };

  const toggleWishlist = (product) => {
    setWishlist((currentWishlist) => {
      const exists = currentWishlist.includes(product.id);
      showToast(exists ? "Removed from wishlist" : "Saved to wishlist");

      return exists
        ? currentWishlist.filter((id) => id !== product.id)
        : [...currentWishlist, product.id];
    });
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
  showToast={showToast}
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
        categories={categories}
        showCategory={showCategory}
        showDeal={showDeal}
        showToast={showToast}
        loadingProducts={loadingProducts}
        productsError={productsError}
        loadProducts={loadProducts}
        filteredProducts={filteredProducts}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        addToCart={addToCart}
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
    </div>
  );
}

export default App;
