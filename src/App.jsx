import Navbar from "./components/Navbar";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { FiHome, FiGrid, FiZap, FiPackage, FiUser } from "react-icons/fi";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";
import "./index.css";
import {
  getStoredCategories,
  saveStoredCategories,
} from "./utils/categories";
import {
  PAGE_META,
  setSeo,
  buildStoreJsonLd,
  SITE_URL,
} from "./seo/seoManager";

// Code-split heavy pages & modals so the initial bundle stays small.
const Contact = lazy(() => import("./pages/Contact"));
const BecomeSeller = lazy(() => import("./pages/BecomeSeller"));
const About = lazy(() => import("./pages/About"));
const Brands = lazy(() => import("./pages/Brands"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));  const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
  const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
  const TryoutPolicy = lazy(() => import("./pages/TryoutPolicy"));
  const Tryouts = lazy(() => import("./pages/Tryouts"));
  const TryoutDashboard = lazy(() => import("./pages/TryoutDashboard"));
  const TryoutOffers = lazy(() => import("./pages/TryoutOffers"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const CheckoutModal = lazy(() => import("./CheckoutModal"));
const AdminPanel = lazy(() => import("./AdminPanel"));
const AccountModal = lazy(() => import("./AccountModal"));

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  );
}

// Deep-link landing for /account (used by the order-confirmation email's
// "My Orders" button). Opens the account modal on the orders tab, then
// returns to the home route so the modal sits on a real page.
function AccountGate({ onOpen }) {
  const navigate = useNavigate();

  useEffect(() => {
    onOpen();
    navigate("/", { replace: true });
  }, [onOpen, navigate]);

  return null;
}

// Sets per-route titles, descriptions, canonical URLs and the store schema on
// every navigation. Product pages override with their own data once loaded.
function RouteSeo() {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    // Every route change opens the new page from the top — without this the
    // browser keeps the previous scroll position, so a product page could
    // open mid-way (e.g. at "About this item") on mobile.
    window.scrollTo(0, 0);

    const isProduct = path.startsWith("/product/");
    const meta = isProduct ? PAGE_META.product : PAGE_META[path] || {};

    setSeo({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url: `${SITE_URL}${path}`,
      jsonLd: path === "/" ? buildStoreJsonLd() : null,
    });
  }, [path]);

  return null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fallbackImage =
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=700&q=85";

function App() {
  const navigate = useNavigate();

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
  const [toastAction, setToastAction] = useState(null);
  const toastTimer = useRef(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState("profile");
  const [checkoutMounted, setCheckoutMounted] = useState(false);
  const [accountMounted, setAccountMounted] = useState(false);
  const [userToken, setUserToken] = useState(() =>
    localStorage.getItem("dealroot_user_token") || ""
  );
  const [user, setUser] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("dealroot_delivery_location") || "null"
      );
    } catch {
      return null;
    }
  });

  // Amazon-style "Deliver to": mark a saved address as the default delivery
  // location (persisted to the account, shown in the navbar).
  const selectDefaultAddress = async (index) => {
    const list = Array.isArray(user?.addresses) ? user.addresses : [];
    if (!userToken || !list[index]) return false;

    const updated = list.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: user.name,
          phone: user.phone,
          addresses: updated,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast?.(data.message || "Could not update delivery address");
        return false;
      }

      setUser(data.user);

      // Choosing a saved address supersedes any GPS-detected location, so
      // the navbar switches back to showing this saved address.
      setDeliveryLocation(null);
      localStorage.removeItem("dealroot_delivery_location");

      showToast?.("Delivery address updated");
      return true;
    } catch {
      showToast?.("Could not update delivery address");
      return false;
    }
  };

  // "Use my current location": store the GPS-detected state/city so the
  // navbar shows it and checkout can prefill + ask for the full address.
  const useCurrentLocation = (location) => {
    const next = {
      stateLabel: location?.stateLabel || "",
      stateValue: location?.stateValue || "",
      city: location?.city || "",
    };

    setDeliveryLocation(next);
    localStorage.setItem("dealroot_delivery_location", JSON.stringify(next));
    showToast?.(
      next.city
        ? `📍 Location set: ${next.city}, ${next.stateLabel}`
        : `📍 Location set: ${next.stateLabel}`
    );
  };

  const showToast = (message, action = null) => {
    setToast(message);
    setToastAction(action);

    // Clear any pending timer so a previous toast can never wipe out
    // the current one early.
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast("");
      setToastAction(null);
    }, 2400);
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
    localStorage.removeItem("dealroot_delivery_location");

    // Clear the backend's abandoned-cart snapshot so no recovery email goes
    // out for a cart the user just dismissed.
    if (userToken) {
      fetch(`${API_URL}/api/cart/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ items: [] }),
      }).catch(() => {});
    }

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
    if (checkoutOpen) setCheckoutMounted(true);
  }, [checkoutOpen]);

  useEffect(() => {
    if (accountOpen) setAccountMounted(true);
  }, [accountOpen]);

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

  // Abandoned cart recovery: snapshot a logged-in user's cart so the backend
  // can email a reminder + discount coupon if they don't check out.
  const cartSaveTimer = useRef(null);

  useEffect(() => {
    if (!userToken) return undefined;

    window.clearTimeout(cartSaveTimer.current);

    cartSaveTimer.current = window.setTimeout(() => {
      // The backend re-derives title/brand/price/image from its own catalogue,
      // so only the product id + quantity are sent.
      fetch(`${API_URL}/api/cart/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      }).catch(() => {});
    }, 2000);

    return () => window.clearTimeout(cartSaveTimer.current);
  }, [cart, userToken]);

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
      const cacheKey = `dealroot_products_${query || "all"}`;
      const cachedRaw = localStorage.getItem(cacheKey);

      // Serve from cache if fresh (< 2 minutes old), show immediately,
      // then fetch fresh data in the background.
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const age = Date.now() - (cached.ts || 0);

          if (age < 2 * 60 * 1000) {
            setProducts(cached.products || []);
            setLoadingProducts(false);
            // Still fetch fresh data, but don't show spinner.
          }
        } catch {
          // ignore corrupt cache
        }
      }

      const response = await fetch(
        `${API_URL}/api/products${query ? `?${query}` : ""}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Products could not be loaded");
      }

      const mapped = (data.products || []).map((product) => ({
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
        tryoutOnly: Boolean(product.tryoutOnly),
        image: product.images?.[0] || product.image || fallbackImage,
        stock: product.stock,
        createdAt: product.createdAt || "",
        marketplaceLinks: Array.isArray(product.marketplaceLinks)
          ? product.marketplaceLinks.filter(
              (link) => link?.platform && link?.url
            )
          : [],
        buyLink: product.buyLink || "",
        buyLinkLabel: product.buyLinkLabel || "",
        buyLinkTerms: product.buyLinkTerms || "",
      }));

      setProducts(mapped);

      // Persist to localStorage so next visit loads instantly.
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), products: mapped })
        );
      } catch {
        // quota exceeded — ignore silently
      }
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

  // Load categories from the server so every browser/device sees the same
  // list. Falls back to localStorage if the API is unreachable.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        const data = await response.json();

        if (response.ok && data.success && Array.isArray(data.categories)) {
          const serverList = data.categories.map((category) => ({
            name: category.name,
            emoji: category.emoji,
            color: category.color,
          }));

          if (serverList.length > 0) {
            // Merge with any locally-added categories instead of replacing,
            // so a slow response can never wipe out a just-added category.
            setCategories((current) => {
              const merged = [...serverList];

              current.forEach((category) => {
                const exists = merged.some(
                  (item) =>
                    item.name.toLowerCase() ===
                    category.name.toLowerCase()
                );

                if (!exists) {
                  merged.push(category);
                }
              });

              saveStoredCategories(merged);
              return merged;
            });
          }
        }
      } catch {
        // keep the localStorage fallback
      }
    };

    loadCategories();
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

  showToast("Product added to cart!", {
    label: "View Bag",
    onClick: () => setCartOpen(true),
  });
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

  const addCategory = async (name, emoji, color) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Category "${cleanName}" already exists`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          emoji: emoji.trim() || "✨",
          color: color || "#f5f5f5",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add category");
      }

      const next = [
        ...categories,
        {
          name: data.category.name,
          emoji: data.category.emoji,
          color: data.category.color,
        },
      ];
      setCategories(next);
      saveStoredCategories(next);
      showToast(`Category "${cleanName}" added`);
    } catch (error) {
      showToast(error.message);
    }
  };

  const removeCategory = async (name) => {
    try {
      const response = await fetch(
        `${API_URL}/api/categories/${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Could not remove category");
      }

      const next = categories.filter((c) => c.name !== name);
      setCategories(next);
      saveStoredCategories(next);
      showToast(`Category "${name}" removed`);
    } catch (error) {
      showToast(error.message);
    }
  };

  // Scroll to a home-page section from the mobile bottom nav. Works from any
  // route (jumps home first if needed) and always re-scrolls, even when the
  // URL hash is already set — plain anchor clicks silently no-op in that case.
  const scrollToHomeSection = (id) => {
    const scroll = () => {
      window.setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    };

    if (window.location.pathname !== "/") {
      navigate("/");
      window.setTimeout(scroll, 200);
      return;
    }

    scroll();
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
      <>
        {toast && <div className="toast">✓ {toast}</div>}
        <Suspense fallback={<PageLoader />}>
          <AdminPanel
            apiUrl={API_URL}
            onBack={closeAdmin}
            showToast={showToast}
            categories={categories}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
          />
        </Suspense>
      </>
    );
  }

  return (
    <div className="app-shell">
      <RouteSeo />

      {toast && (
        <div className={`toast ${toastAction ? "toast-with-action" : ""}`}>
          <span className="toast-text">✓ {toast}</span>
          {toastAction && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toastAction.onClick?.();
                setToast("");
                setToastAction(null);
              }}
            >
              {toastAction.label} →
            </button>
          )}
        </div>
      )}

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

      {checkoutMounted && (
        <Suspense fallback={<PageLoader />}>
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
            deliveryLocation={deliveryLocation}
          />
        </Suspense>
      )}

      {accountMounted && (
        <Suspense fallback={null}>
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
            initialTab={accountTab}
          />
        </Suspense>
      )}

<Navbar
  search={search}
  setSearch={setSearch}
  openAdmin={openAdmin}
  user={user}
  wishlist={wishlist}
  cartCount={cartCount}
  setAccountOpen={setAccountOpen}
  setAccountTab={setAccountTab}
  onSelectAddress={selectDefaultAddress}
  onUseCurrentLocation={useCurrentLocation}
  deliveryLocation={deliveryLocation}
  setCartOpen={setCartOpen}
  openWishlist={openWishlist}
  showBestsellers={showBestsellers}
  showAllProducts={showAllProducts}
  showNewArrivals={showNewArrivals}
  categories={categories}
  showCategory={showCategory}
/>

<Suspense fallback={<PageLoader />}>
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
        products={products}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        addToCart={addToCart}
        banners={banners}
        user={user}
        userToken={userToken}
        apiUrl={API_URL}
        setAccountOpen={setAccountOpen}
      />
    }
  />

  <Route path="/contact" element={<Contact />} />
  <Route path="/become-a-seller" element={<BecomeSeller />} />
  <Route path="/about" element={<About />} />
  <Route path="/brands" element={<Brands />} />
  <Route path="/track-order" element={<Navigate to="/account" replace />} />
  <Route
    path="/account"
    element={
      <AccountGate
        onOpen={() => {
          setAccountTab("orders");
          setAccountOpen(true);
        }}
      />
    }
  />
  <Route path="/privacy" element={<PrivacyPolicy />} />
  <Route path="/terms" element={<Terms />} />
  <Route path="/shipping" element={<ShippingPolicy />} />
  <Route path="/refund" element={<RefundPolicy />} />
  <Route path="/tryout-policy" element={<TryoutPolicy />} />
  <Route
    path="/tryouts"
    element={
      <Tryouts
        fallbackImage={fallbackImage}
        filteredProducts={filteredProducts}
        products={products}
        addToCart={addToCart}
        user={user}
        userToken={userToken}
        apiUrl={API_URL}
        setAccountOpen={setAccountOpen}
      />
    }
  />
  <Route
    path="/tryouts/dashboard"
    element={
      <TryoutDashboard
        products={products}
        filteredProducts={filteredProducts}
        user={user}
        userToken={userToken}
        apiUrl={API_URL}
        setAccountOpen={setAccountOpen}
      />
    }
  />
  <Route
    path="/tryouts/offers"
    element={
      <TryoutOffers
        fallbackImage={fallbackImage}
        filteredProducts={filteredProducts}
        products={products}
        addToCart={addToCart}
        user={user}
        userToken={userToken}
        apiUrl={API_URL}
        setAccountOpen={setAccountOpen}
      />
    }
  />
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
</Suspense>
<Footer />

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-nav-items">
          <a
            href="#top"
            className="mobile-nav-item active"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <FiHome />
            <span className="mn-label">Home</span>
          </a>
          <a
            href="#categories"
            className="mobile-nav-item"
            onClick={(event) => {
              event.preventDefault();
              scrollToHomeSection("categories");
            }}
          >
            <FiGrid />
            <span className="mn-label">Categories</span>
          </a>
          <a
            href="#price-deals"
            className="mobile-nav-item"
            onClick={(event) => {
              event.preventDefault();
              scrollToHomeSection("price-deals");
            }}
          >
            <FiZap />
            <span className="mn-label">Deals</span>
          </a>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => {
              setAccountTab("orders");
              setAccountOpen(true);
            }}
          >
            <FiPackage />
            <span className="mn-label">Orders</span>
          </button>
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => {
              setAccountTab("profile");
              setAccountOpen(true);
            }}
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
