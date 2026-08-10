import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiChevronDown, FiMenu, FiSettings, FiMapPin, FiCrosshair, FiLoader } from "react-icons/fi";
import {
  getCurrentPosition,
  reverseGeocode,
  geolocationErrorMessage,
} from "../utils/geoLocation";

export default function Navbar({
  search,
  setSearch,
  openAdmin,
  user,
  wishlist,
  cartCount,
  setAccountOpen,
  setAccountTab,
  onSelectAddress,
  onUseCurrentLocation,
  deliveryLocation,
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
  const [deliverToOpen, setDeliverToOpen] = useState(false);
  const deliverToRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const navigate = useNavigate();

  const defaultAddress = (user?.addresses || []).find((a) => a.isDefault);

  // Close the deliver-to popover on outside click or Escape.
  useEffect(() => {
    if (!deliverToOpen) return undefined;

    const closeOnOutside = (event) => {
      if (deliverToRef.current && !deliverToRef.current.contains(event.target)) {
        setDeliverToOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setDeliverToOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [deliverToOpen]);

  const openAccountTab = (tab) => {
    setDeliverToOpen(false);
    setAccountTab?.(tab);
    setAccountOpen(true);
  };

  // Detect the user's current location via GPS, reverse-geocode it to an
  // Indian state + city, then let the parent decide what to do with it.
  const detectCurrentLocation = async () => {
    if (locating) return;

    setLocating(true);
    setLocationError("");

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const { state, city } = await reverseGeocode(latitude, longitude);

      if (!state) {
        throw new Error(
          "Could not identify your state. Please enter your address manually."
        );
      }

      setDeliverToOpen(false);
      onUseCurrentLocation?.({
        stateLabel: state.label,
        stateValue: state.value,
        city: city || "",
      });
    } catch (error) {
      setLocationError(geolocationErrorMessage(error));
    } finally {
      setLocating(false);
    }
  };

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
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>🚚 FREE DELIVERY on orders above ₹499</span>
        <span>🎁 USE CODE: BEAUTY10 - Get 10% OFF on orders above ₹999</span>
        <div className="ann-right">
          <button
            type="button"
            onClick={() => {
              setAccountTab?.("orders");
              setAccountOpen(true);
            }}
          >
            Track Order
          </button>
          <Link to="/contact">Help Center</Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="header-main">
        <Link to="/" className="header-logo">
          <span className="logo-main">DealRoot</span>
          <span className="logo-sub">BEAUTY</span>
        </Link>

        <div className="deliver-to-wrap" ref={deliverToRef}>
          <button
            type="button"
            className="deliver-to-btn"
            onClick={() => setDeliverToOpen((open) => !open)}
            aria-expanded={deliverToOpen}
            aria-haspopup="dialog"
          >
            <FiMapPin size={20} />
            <span className="deliver-to-copy">
              <small>Deliver to</small>
              <b>
                {deliveryLocation?.city
                  ? `${deliveryLocation.city}, ${deliveryLocation.stateLabel}`
                  : defaultAddress
                  ? `${defaultAddress.city}, ${defaultAddress.pincode}`
                  : deliveryLocation?.stateLabel
                  ? deliveryLocation.stateLabel
                  : user
                  ? "Select address"
                  : "Login to choose"}
              </b>
            </span>
            <FiChevronDown
              size={16}
              className={`deliver-chevron ${deliverToOpen ? "open" : ""}`}
            />
          </button>

          {deliverToOpen && (
            <div className="deliver-popover" role="dialog" aria-label="Choose delivery address">
              <button
                type="button"
                className={`deliver-locate-btn ${locating ? "locating" : ""}`}
                onClick={detectCurrentLocation}
                disabled={locating}
              >
                {locating ? (
                  <FiLoader className="deliver-locate-spin" size={17} />
                ) : (
                  <FiCrosshair size={17} />
                )}
                <span>
                  <b>
                    {locating ? "Detecting your location..." : "Use my current location"}
                  </b>
                  <small>
                    Auto-fill your city & state from GPS
                  </small>
                </span>
              </button>

              {locationError && (
                <p className="deliver-locate-error" role="alert">
                  {locationError}
                </p>
              )}

              {!user ? (
                <div className="deliver-popover-empty">
                  <FiMapPin size={26} />
                  <p>
                    <b>Sign in to choose a delivery address</b>
                    <span>Your saved addresses will appear here.</span>
                  </p>
                  <button type="button" onClick={() => openAccountTab("profile")}>
                    Sign in
                  </button>
                </div>
              ) : (user.addresses || []).length === 0 ? (
                <div className="deliver-popover-empty">
                  <FiMapPin size={26} />
                  <p>
                    <b>No saved addresses yet</b>
                    <span>Add an address to speed up checkout.</span>
                  </p>
                  <button type="button" onClick={() => openAccountTab("profile")}>
                    Add address
                  </button>
                </div>
              ) : (
                <>
                  <p className="deliver-popover-title">Choose a delivery address</p>
                  <div className="deliver-address-list">
                    {user.addresses.map((addr, index) => (
                      <button
                        type="button"
                        key={index}
                        className={`deliver-address-item ${
                          addr.isDefault ? "selected" : ""
                        }`}
                        onClick={() => {
                          setDeliverToOpen(false);
                          onSelectAddress?.(index);
                        }}
                      >
                        <span className="deliver-address-name">
                          {addr.name}
                          {addr.isDefault && (
                            <em className="deliver-default-tag">DEFAULT</em>
                          )}
                        </span>
                        <span className="deliver-address-detail">
                          📍 {addr.city}, {addr.state} — {addr.pincode}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="deliver-manage-btn"
                    onClick={() => openAccountTab("profile")}
                  >
                    Manage addresses
                  </button>
                </>
              )}
            </div>
          )}
        </div>

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
            onClick={() => {
              setAccountTab?.("profile");
              setAccountOpen(true);
            }}
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