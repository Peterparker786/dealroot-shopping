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

  // Flash deal products (first 5)
  const flashProducts = filteredProducts.slice(0, 5);

  // Deal of the Day: the 5 cheapest products (from the full catalogue,
  // independent of any active category/search filter).
  const dealProducts = useMemo(() => {
    const pool = products && products.length ? products : filteredProducts;

    return [...pool]
      .filter((p) => p && Number.isFinite(Number(p.price)))
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 5);
  }, [products, filteredProducts]);

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
            {filteredProducts.map((product) => {
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
                      ★ <b>{product.rating}</b> <span>({product.reviews})</span>
                    </div>
                    <div className="price-row">
                      <strong>₹{product.price}</strong>
                      <del>₹{product.originalPrice}</del>
                      {discount > 0 && <span>{discount}% off</span>}
                    </div>
                    <button
                      type="button"
                      className="add-button"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock <= 0 ? "Out of stock" : "Add to Cart"}
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

      {/* Why Shop With Us */}
      <section className="why-section">
        <h2>Why Shop With Us</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon"><FiAward size={20} /></div>
            <h4>100% Authentic</h4>
            <p>We only sell genuine products from authorized brands</p>
          </div>
          <div className="why-card">
            <div className="why-icon"><FiTag size={20} /></div>
            <h4>Best Prices</h4>
            <p>Affordable beauty for every budget</p>
          </div>
          <div className="why-card">
            <div className="why-icon"><FiTruck size={20} /></div>
            <h4>Fast Delivery</h4>
            <p>Quick & reliable delivery right to your doorstep</p>
          </div>
          <div className="why-card">
            <div className="why-icon"><FiRefreshCw size={20} /></div>
            <h4>Easy Returns</h4>
            <p>Hassle-free 7-day return policy</p>
          </div>
          <div className="why-card">
            <div className="why-icon"><FiShield size={20} /></div>
            <h4>Secure Payments</h4>
            <p>Safe & trusted payments via UPI, Cards & COD</p>
          </div>
        </div>
      </section>
    </main>
  );
}