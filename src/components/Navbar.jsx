import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiChevronDown, FiMenu, FiSettings } from "react-icons/fi";

export default function Navbar({
  search,
  setSearch,
  openAdmin,
  user,
  wishlist,
  cartCount,
  setAccountOpen,
  setCartOpen,
  openWishlist,
  showBestsellers,
  showAllProducts,
  showNewArrivals,
  categories = [],
  showCategory,
}) {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close the category dropdown on outside click or Escape.
  useEffect(() => {
    if (!categoryMenuOpen) return undefined;

    const closeOnOutside = (event) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target)
      ) {
        setCategoryMenuOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setCategoryMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [categoryMenuOpen]);

  const pickCategory = (category) => {
    setCategoryMenuOpen(false);

    // The category filter + #products section only live on the home page,
    // so jump home first when browsing any other route.
    if (window.location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => {
        showCategory?.(category);
        document
          .getElementById("products")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return;
    }

    showCategory?.(category);
    window.setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };
  return (
    <>
      {/* Scrolling Marquee Bar (Nykaa style) */}
      <div className="top-marquee" aria-hidden="true">
        <div className="marquee-track">
          <span className="marquee-text">
            ✨ COST SALE IS LIVE! FREE SHIPPING ON ALL ORDERS ABOVE ₹499! ✨ USE CODE: BEAUTY10 FOR 10% OFF ON ORDERS ABOVE ₹999! ✨ 100% ORIGINAL PRODUCTS — EASY RETURNS IN 7 DAYS ✨
          </span>
          <span className="marquee-text">
            ✨ COST SALE IS LIVE! FREE SHIPPING ON ALL ORDERS ABOVE ₹499! ✨ USE CODE: BEAUTY10 FOR 10% OFF ON ORDERS ABOVE ₹999! ✨ 100% ORIGINAL PRODUCTS — EASY RETURNS IN 7 DAYS ✨
          </span>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>🚚 FREE DELIVERY on orders above ₹499</span>
        <span>🎁 USE CODE: BEAUTY10 - Get 10% OFF on orders above ₹999</span>
        <div className="ann-right">
          <Link to="/track-order">Track Order</Link>
          <Link to="/contact">Help Center</Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="header-main">
        <Link to="/" className="header-logo">
          <span className="logo-main">DealRoot</span>
          <span className="logo-sub">BEAUTY</span>
        </Link>

        <label className="header-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for products, brands..."
          />
          <button type="button" aria-label="Search">
            <FiSearch />
          </button>
        </label>

        <nav className="header-actions">
          <button
            type="button"
            className="header-action-btn"
            onClick={openAdmin}
            title="Admin Panel"
          >
            <FiSettings />
            <span className="h-label">Admin</span>
          </button>

          <button
            type="button"
            className="header-action-btn"
            onClick={openWishlist}
            title="Wishlist"
          >
            <FiHeart />
            {wishlist.length > 0 && <em className="header-badge">{wishlist.length}</em>}
            <span className="h-label">Wishlist</span>
          </button>

          <button
            type="button"
            className="header-action-btn"
            onClick={() => setCartOpen(true)}
          >
            <FiShoppingBag />
            {cartCount > 0 && <em className="header-badge">{cartCount}</em>}
            <span className="h-label">Cart</span>
          </button>

          <button
            type="button"
            className="header-action-btn"
            onClick={() => setAccountOpen(true)}
          >
            <FiUser />
            <span className="h-label">{user ? user.name.split(" ")[0] : "Account"}</span>
            <span className="h-sub">{user ? "Profile" : "Sign in"}</span>
          </button>
        </nav>
      </header>

      {/* Sub-Navigation */}
      <nav className="sub-nav">
        <div className="shop-by-wrap" ref={categoryMenuRef}>
          <button
            className={`shop-by-btn ${categoryMenuOpen ? "open" : ""}`}
            type="button"
            aria-expanded={categoryMenuOpen}
            aria-haspopup="menu"
            onClick={() => setCategoryMenuOpen((open) => !open)}
          >
            <FiMenu size={14} /> Shop by Category{" "}
            <FiChevronDown size={12} className={categoryMenuOpen ? "rotate" : ""} />
          </button>

          {categoryMenuOpen && (
            <div className="category-menu" role="menu">
              <button
                type="button"
                className="category-menu-item"
                role="menuitem"
                onClick={() => pickCategory("All")}
              >
                <span className="category-menu-emoji all">All</span>
                All Products
              </button>

              {categories.map((category) => (
                <button
                  type="button"
                  className="category-menu-item"
                  role="menuitem"
                  key={category.name}
                  onClick={() => pickCategory(category.name)}
                >
                  <span
                    className="category-menu-emoji"
                    style={{ background: category.color || "#f5f5f5" }}
                  >
                    {category.emoji || "✨"}
                  </span>
                  {category.label || category.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <a
          href="#top"
          className="active"
          onClick={(e) => {
            e.preventDefault();
            showAllProducts?.();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Home
        </a>
        <a
          href="#products"
          onClick={(e) => {
            e.preventDefault();
            showBestsellers?.();
          }}
        >
          Bestsellers
        </a>
        <a
          href="#products"
          onClick={(e) => {
            e.preventDefault();
            showNewArrivals?.();
          }}
        >
          New Arrivals
        </a>
        <Link to="/brands">Brands</Link>
        <a href="#price-deals">
          Offers <span className="hot-badge">Hot</span>
        </a>
      </nav>
    </>
  );
}