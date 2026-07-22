import { useEffect, useMemo, useState } from "react";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import AdminPanel from "./AdminPanel";

const API_URL = import.meta.env.VITE_API_URL || "const API_URL = "https://dealroot-backend.onrender.com/api";";

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
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");

      const params = new URLSearchParams();

      if (activeCategory !== "All") {
        params.set("category", activeCategory);
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
  }, [activeCategory, search]);

  const filteredProducts = useMemo(() => products, [products]);

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
      />

      <div className="top-strip">
        <p>Free delivery on orders above ₹499</p>
        <p>100% genuine beauty products</p>
      </div>

      <header className="navbar">
        <a className="brand" href="#top" aria-label="Dealroot home">
          <span className="brand-mark">D</span>
          <span>DEALROOT<small>BEAUTY</small></span>
        </a>

        <label className="search-box">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search beauty, skincare, makeup..."
          />
        </label>

        <nav className="nav-actions">
          <button onClick={openAdmin}>
            <span>⚙</span>
            <b>Admin</b>
          </button>

          <button onClick={() => showToast("Login feature is coming next")}>
            <span>♙</span>
            <b>Account</b>
          </button>

          <button onClick={() => showToast("Wishlist feature is coming next")}>
            <span>♡</span>
            <b>Wishlist</b>
            {wishlist.length > 0 && <em>{wishlist.length}</em>}
          </button>

          <button className="cart-button" onClick={() => setCartOpen(true)}>
            <span>🛒</span>
            <b>Cart</b>
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">DEALROOT BEAUTY DAYS</span>
            <h1>Beauty deals<br />you’ll love.</h1>
            <p>
              Discover genuine favourites in skincare, makeup and more—at prices
              that make every day feel special.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("products")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Shop bestsellers <span>→</span>
              </button>
              <button className="text-button" onClick={() => showToast("Offers opened")}>
                View all offers
              </button>
            </div>
          </div>

          <div className="hero-art">
            <div className="glow glow-one" />
            <div className="glow glow-two" />
            <div className="deal-card">
              <span>UP TO</span><strong>50%</strong><b>OFF</b>
              <small>on beauty favourites</small>
            </div>
            <img
              src={fallbackImage}
              alt="Beauty products"
            />
          </div>
        </section>

        <section className="benefits">
          <div><span>✓</span><p><b>100% Genuine</b>Verified products only</p></div>
          <div><span>⚡</span><p><b>Fast delivery</b>Same-day in Kanpur</p></div>
          <div><span>↺</span><p><b>Easy returns</b>Simple 7-day return policy</p></div>
          <div><span>🔒</span><p><b>Secure payments</b>UPI, cards & COD</p></div>
        </section>

        <section className="section category-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow blue">SHOP BY CATEGORY</span>
              <h2>Everything beauty, in one place</h2>
            </div>
            <button onClick={() => setActiveCategory("All")}>View all →</button>
          </div>

          <div className="categories">
            <button
              className={`category-card ${activeCategory === "All" ? "active" : ""}`}
              onClick={() => setActiveCategory("All")}
            >
              <span style={{ background: "#E5EDFF" }}>★</span><b>All Deals</b>
            </button>

            {categories.map((category) => (
              <button
                className={`category-card ${
                  activeCategory === category.name ? "active" : ""
                }`}
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
              >
                <span style={{ background: category.color }}>{category.emoji}</span>
                <b>{category.label || category.name}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="offer-banner">
          <div>
            <span>LIMITED TIME OFFER</span>
            <h2>Glow more.<br />Spend less.</h2>
            <p>Extra 10% off on your first order.</p>
          </div>
          <button onClick={() => showToast("Coupon copied: WELCOME10")}>
            Use code <b>WELCOME10</b>
          </button>
        </section>

        <section className="section products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow blue">TRENDING NOW</span>
              <h2>Beauty favourites at better prices</h2>
            </div>
            <button onClick={() => setActiveCategory("All")}>See all products →</button>
          </div>

          {loadingProducts && <div className="empty-state">Loading beauty products...</div>}

          {!loadingProducts && productsError && (
            <div className="empty-state">
              <p>{productsError}</p>
              <button className="secondary-button" onClick={loadProducts}>Try again</button>
            </div>
          )}

          {!loadingProducts && !productsError && (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const isWishlisted = wishlist.includes(product.id);
                const discount = product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      {product.badge && <span className="product-badge">{product.badge}</span>}
                      <button
                        className={`wishlist ${isWishlisted ? "selected" : ""}`}
                        onClick={() => toggleWishlist(product)}
                      >
                        {isWishlisted ? "♥" : "♡"}
                      </button>
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(event) => { event.currentTarget.src = fallbackImage; }}
                      />
                    </div>

                    <div className="product-info">
                      <p className="brand-name">{product.brand}</p>
                      <h3>{product.name}</h3>
                      <div className="rating"><b>★ {product.rating}</b><span>({product.reviews})</span></div>
                      <div className="price-row">
                        <strong>₹{product.price}</strong>
                        <del>₹{product.originalPrice}</del>
                        {discount > 0 && <span>{discount}% off</span>}
                      </div>
                      {product.marketplaceLinks.length > 0 && (
                        <div className="market-price-box">
                          <span>See market price</span>
                          <div className="market-links">
                            {product.marketplaceLinks.map((link) => (
                              <a
                                key={`${product.id}-${link.platform}-${link.url}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Check ${product.name} price on ${link.platform}`}
                              >
                                {link.platform} <b>↗</b>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        className="add-button"
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product)}
                      >
                        {product.stock <= 0 ? "Out of stock" : "Add to cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loadingProducts && !productsError && filteredProducts.length === 0 && (
            <div className="empty-state">No products found. Try another search or category.</div>
          )}
        </section>
      </main>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">D</span>
          <span>DEALROOT<small>BEAUTY</small></span>
        </div>
        <p>Smart deals. Everyday.</p>
        <span>© 2026 DEALROOT. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default App;
