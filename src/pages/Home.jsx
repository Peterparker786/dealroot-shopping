import Hero from "../components/Hero/Hero";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiTruck, FiRefreshCw, FiShield, FiTag, FiAward, FiZap } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { optimizeImage } from "../utils/cloudinary";

export default function Home({
  fallbackImage,
  showAllProducts,
  _activeCategory,
  activeDeal,
  bestsellersOnly,
  newArrivalsOnly,
  categories,
  showCategory,
  showDeal,
  loadingProducts,
  productsError,
  loadProducts,
  filteredProducts,
  products,
  wishlist,
  toggleWishlist,
  addToCart,
  banners,
  user,
  userToken,
  apiUrl,
}) {
  // Flash deal countdown timer
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 23, s: 47 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 0; m = 0; s = 0; clearInterval(timer); }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (n) => String(n).padStart(2, "0");

  // ---------- Dealroot Tryouts ----------
  // Status: loading | none | pending | approved | rejected | disqualified
  const [tryoutStatus, setTryoutStatus] = useState("loading");

  // Tryout-only products stay out of the general catalogue until the user
  // is an approved Tryout member.
  const tryoutApproved = tryoutStatus === "approved";
  const shopProducts = tryoutApproved
    ? filteredProducts
    : filteredProducts.filter((p) => !p.tryoutOnly);

  useEffect(() => {
    if (!user || !userToken) {
      setTryoutStatus("none");
      return undefined;
    }

    let requestCancelled = false;

    const loadTryoutStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/tryouts/my`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        const data = await response.json();

        if (!requestCancelled) {
          setTryoutStatus(
            data.application ? data.application.status : "none"
          );
        }
      } catch {
        if (!requestCancelled) {
          setTryoutStatus("none");
        }
      }
    };

    loadTryoutStatus();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, user, userToken]);

  // Flash Deals shows the same products as the ₹99 collection — only items
  // priced at ₹99 or less, or explicitly marked as a ₹99 deal.
  const flashProducts = (tryoutApproved
    ? filteredProducts
    : filteredProducts.filter((p) => !p.tryoutOnly)
  )
    .filter((p) => p.dealType === "99" || Number(p.price) <= 99)
    .slice(0, 5);

  // Deal of the Day: only products priced at ₹199 or under, or explicitly
  // marked as a ₹199 deal — anything above ₹199 never appears here.
  const dealProducts = useMemo(() => {
    const pool = products && products.length ? products : filteredProducts;
    const shopPool = tryoutApproved
      ? pool
      : pool.filter((p) => !p.tryoutOnly);

    return [...shopPool]
      .filter(
        (p) =>
          p &&
          Number.isFinite(Number(p.price)) &&
          (p.dealType === "199" || Number(p.price) <= 199)
      )
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 5);
  }, [products, filteredProducts, tryoutApproved]);

  // Deal of the Day countdown — resets every midnight.
  const [dealTimeLeft, setDealTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setDealTimeLeft({ h, m, s });
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main id="top">
      <Hero fallbackImage={fallbackImage} banners={banners} />

      {/* Shop by Category */}
      <section className="section" id="categories">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <a href="#" onClick={(e) => { e.preventDefault(); showAllProducts(); }}>View all <FiArrowRight size={14} style={{ display: 'inline' }} /></a>
        </div>

        <div className="categories-row">
          <div className="cat-circle" onClick={showAllProducts}>
            <div className="cat-avatar" style={{ background: 'var(--brand-bg)', color: 'var(--brand)', fontSize: 14, fontWeight: 700 }}>All</div>
            <span className="cat-name">All</span>
          </div>

          {categories.map((category) => (
            <div
              className="cat-circle"
              key={category.name}
              onClick={() => showCategory(category.name)}
            >
              <div className="cat-avatar" style={{ background: category.color }}>
                {category.emoji}
              </div>
              <span className="cat-name">{category.label || category.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Deals */}
      <section className="section" id="price-deals">
        <div className="flash-header">
          <h2>🔥 Flash Deals</h2>
          <div className="flash-timer">
            <FiClock size={14} /> Ends in {formatTime(timeLeft.h)} : {formatTime(timeLeft.m)} : {formatTime(timeLeft.s)}
          </div>
          <a href="#" className="flash-view-all" onClick={(e) => { e.preventDefault(); showAllProducts(); }}>
            View all deals <FiArrowRight size={14} style={{ display: 'inline' }} />
          </a>
        </div>

        {loadingProducts ? (
          <div className="products-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flash-card">
                <div className="skeleton-img" style={{ height: 200 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton-line" style={{ width: '50%', marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: '80%', marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: '40%', marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ width: '100%', height: 36, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="products-row">
            {flashProducts.map((product) => {
              const discount = product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div className="flash-card" key={product.id}>
                  <div className="flash-card-img">
                    {discount > 0 && <span className="flash-discount">-{discount}%</span>}
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={optimizeImage(product.images?.[0] || product.image, 400)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  </div>
                  <div className="flash-card-body">
                    <div className="flash-card-brand">{product.brand}</div>
                    <div className="flash-card-title">{product.name}</div>
                    <div className="flash-card-rating">
                      ★ <b>{product.rating}</b> ({product.reviews})
                    </div>
                    <div className="flash-card-price">
                      <strong>₹{product.price}</strong>
                      {product.originalPrice > product.price && <del>₹{product.originalPrice}</del>}
                    </div>
                    <button
                      className="flash-card-add"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Price Deal Banners */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="price-deal-grid">
          <button
            type="button"
            className={`price-deal-banner deal-99 ${activeDeal === "99" ? "active" : ""}`}
            onClick={() => showDeal("99")}
          >
            <span>Curated picks</span>
            <strong>₹99</strong>
            <div>
              <h3>Essentials</h3>
              <p>Beauty must-haves at just ₹99</p>
            </div>
            <b>Shop now</b>
          </button>

          <button
            type="button"
            className={`price-deal-banner deal-199 ${activeDeal === "199" ? "active" : ""}`}
            onClick={() => showDeal("199")}
          >
            <span>More value</span>
            <strong>₹199</strong>
            <div>
              <h3>Premium picks</h3>
              <p>Favourites at just ₹199</p>
            </div>
            <b>Shop now</b>
          </button>
        </div>
      </section>

      {/* Deal of the Day */}
      <section className="section deal-day-section" id="deal-of-the-day">
        <div className="deal-day-header">
          <div className="deal-day-title-wrap">
            <span className="eyebrow blue">TODAY'S BEST PRICE</span>
            <h2>Deal of the Day</h2>
          </div>

          <div className="deal-day-timer">
            <FiZap size={15} />
            Ends in {formatTime(dealTimeLeft.h)}:{formatTime(dealTimeLeft.m)}:{formatTime(dealTimeLeft.s)}
          </div>
        </div>

        {loadingProducts ? (
          <div className="deal-day-track">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="deal-day-card">
                <div className="skeleton-img" style={{ height: 220 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton-line" style={{ width: '40%', marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: '85%', marginBottom: 10 }} />
                  <div className="skeleton-line" style={{ width: '50%', marginBottom: 12 }} />
                  <div className="skeleton-line" style={{ width: '100%', height: 40, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="deal-day-track">
            {dealProducts.map((product) => {
              const discount = product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div className="deal-day-card" key={product.id}>
                  <Link to={`/product/${product.id}`} className="deal-day-card-img">
                    <img
                      src={optimizeImage(product.images?.[0] || product.image, 500)}
                      alt={product.name}
                      loading="lazy"
                    />
                    {discount > 0 && (
                      <span className="deal-day-discount">-{discount}%</span>
                    )}
                  </Link>

                  <div className="deal-day-card-body">
                    <p className="deal-day-brand">{product.brand}</p>
                    <h3>
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                    </h3>
                    <div className="deal-day-price">
                      <strong>₹{product.price}</strong>
                      {product.originalPrice > product.price && (
                        <del>₹{product.originalPrice}</del>
                      )}
                    </div>
                    <Link to={`/product/${product.id}`} className="deal-day-buy">
                      Buy Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Grid */}
      <section className="section products-section" id="products">
        <div className="section-header">
          <h2>
            {newArrivalsOnly
              ? "New Arrivals"
              : bestsellersOnly
              ? "Bestsellers Under ₹200"
              : activeDeal === "99"
              ? "The ₹99 Collection"
              : activeDeal === "199"
              ? "The ₹199 Collection"
              : "Our Favourites"}
          </h2>
          <a href="#" onClick={(e) => { e.preventDefault(); showAllProducts(); }}>
            See all <FiArrowRight size={14} style={{ display: 'inline' }} />
          </a>
        </div>

        {loadingProducts && (
          <div className="product-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="skeleton-card">
                <div className="skeleton-img" />
                <div style={{ padding: '20px' }}>
                  <div className="skeleton-line" style={{ width: '40%', marginBottom: '10px' }} />
                  <div className="skeleton-line" style={{ width: '85%', marginBottom: '12px' }} />
                  <div className="skeleton-line" style={{ width: '60%', marginBottom: '16px' }} />
                  <div className="skeleton-line" style={{ width: '100%', height: '36px', borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingProducts && productsError && (
          <div className="empty-state">
            <p>{productsError}</p>
            <button type="button" className="hero-btn-primary" onClick={loadProducts}>
              Try again
            </button>
          </div>
        )}

        {!loadingProducts && !productsError && (
          <div className="product-grid">
            {shopProducts.map((product) => {
              const isWishlisted = wishlist.some((w) => w.id === product.id);
              const discount = product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    {(product.dealType !== "none" || product.badge) && (
                      <span className="product-badge">
                        {product.dealType === "99" ? "₹99" : product.dealType === "199" ? "₹199" : product.badge}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="product-discount-badge">{discount}% OFF</span>
                    )}
                    <button
                      type="button"
                      className={`wishlist ${isWishlisted ? "selected" : ""}`}
                      onClick={() => toggleWishlist(product)}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isWishlisted ? "♥" : "♡"}
                    </button>
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={optimizeImage(product.images?.[0] || product.image, 400)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => { event.currentTarget.src = fallbackImage; }}
                      />
                    </Link>
                  </div>

                  <div className="product-info">
                    <p className="brand-name">{product.brand}</p>
                    <h3><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
                    <div className="rating">
                      <span className="stars-filled">{'★'.repeat(Math.round(Number(product.rating) || 0))}</span><span className="stars-empty">{'☆'.repeat(5 - Math.round(Number(product.rating) || 0))}</span>
                      <span className="rating-count"> ({product.reviews})</span>
                    </div>
                    <div className="price-row">
                      <strong className="price-current">₹{product.price}</strong>
                      {discount > 0 && <del className="price-original">₹{product.originalPrice}</del>}
                    </div>
                    {product.stock > 0 && product.stock <= 10 && (
                      <div className="stock-urgency">
                        <span className="urgency-dot" /> Only {product.stock} left — hurry!
                      </div>
                    )}
                    <button
                      type="button"
                      className="add-button"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock <= 0 ? "Out of Stock" : "🛒 Add to Cart"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loadingProducts && !productsError && filteredProducts.length === 0 && (
          <div className="empty-state">
            No products found. Try another search or category.
          </div>
        )}
      </section>

      {/* Dealroot Tryouts — teaser */}
      <section className="section tryout-section tryout-teaser-section" id="tryouts">
        <div className="tryout-pills">
          <span className="tryout-pill">✦ WELCOME TO</span>
          <span className="tryout-pill tryout-pill-main">DEALROOT TESTERS COMMUNITY</span>
          <span className="tryout-pill">Products Free or Upto 90% Off</span>
        </div>

        <Link to="/tryouts" className="tryout-teaser">
          <span className="tryout-teaser-emoji">🛍️</span>
          <div className="tryout-teaser-copy">
            <b>Tryout deals</b>
            <p>
              {tryoutApproved
                ? "Your deals are unlocked — shop below!"
                : "New exclusive member products will appear here shortly."}
            </p>
          </div>
          <span className="tryout-teaser-cta">
            {tryoutApproved ? "View your deals →" : "Explore Tryout deals →"}
          </span>
        </Link>
      </section>

      {/* Recently Viewed */}
      {(() => {
        let recentProducts = [];
        try {
          const raw = localStorage.getItem("dealroot_recently_viewed") || "[]";
          const ids = JSON.parse(raw).map((r) => r.id).slice(0, 6);
          recentProducts = ids
            .map((rid) => products.find((p) => p.id === rid))
            .filter(Boolean);
        } catch { /* ignore */ }

        if (!recentProducts.length) return null;

        return (
          <section className="section">
            <h2>Recently Viewed</h2>
            <div className="product-grid">
              {recentProducts.map((product) => {
                const isWishlisted = wishlist.some((w) => w.id === product.id);
                const discount = product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <article className="product-card" key={`recent-${product.id}`}>
                    <div className="product-image">
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={optimizeImage(product.image, 400)}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                      <button
                        type="button"
                        className="wishlist-btn"
                        onClick={() => toggleWishlist(product)}
                      >
                        {isWishlisted ? "♥" : "♡"}
                      </button>
                    </div>
                    <div className="product-info">
                      <p className="product-brand">{product.brand}</p>
                      <h3 className="product-title">
                        <Link to={`/product/${product.id}`}>{product.name}</Link>
                      </h3>
                      <div className="product-price">
                        <strong>₹{product.price}</strong>
                        {product.originalPrice > product.price && (
                          <del>₹{product.originalPrice}</del>
                        )}
                        {discount > 0 && <span>{discount}% off</span>}
                      </div>
                      <button
                        type="button"
                        className="add-to-cart-btn"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Why Shop With Us */}
      <section className="why-section">
        <span className="why-eyebrow">✦ WHY DEALROOT</span>
        <h2>Trusted by 10,000+ beauty lovers</h2>
        <div className="why-grid">
          <div className="why-card why-card--accent">
            <div className="why-icon why-icon--accent"><FiAward size={22} /></div>
            <h4>100% Authentic</h4>
            <p>Every product sourced directly from authorized brand distributors. Zero fakes, guaranteed.</p>
          </div>
          <div className="why-card why-card--green">
            <div className="why-icon why-icon--green"><FiTruck size={22} /></div>
            <h4>Free Delivery</h4>
            <p>Free shipping on orders above ₹499. COD available across India for your convenience.</p>
          </div>
          <div className="why-card why-card--orange">
            <div className="why-icon why-icon--orange"><FiRefreshCw size={22} /></div>
            <h4>7-Day Returns</h4>
            <p>Not satisfied? Return within 7 days for a full refund. No questions asked.</p>
          </div>
          <div className="why-card why-card--purple">
            <div className="why-icon why-icon--purple"><FiShield size={22} /></div>
            <h4>Secure Payments</h4>
            <p>Razorpay-protected checkout. Pay via UPI, cards, net banking or cash on delivery.</p>
          </div>
        </div>
      </section>
    </main>
  );
}