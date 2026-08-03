import Hero from "../components/Hero/Hero";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiZap,
  FiRefreshCw,
  FiLock,
} from "react-icons/fi";

export default function Home({
  fallbackImage,
  showAllProducts,
  activeCategory,
  activeDeal,
  categories,
  showCategory,
  showDeal,
  showToast,
  loadingProducts,
  productsError,
  loadProducts,
  filteredProducts,
  wishlist,
  toggleWishlist,
  addToCart,
  banner,
}) {
  return (
    <main id="top">
      <Hero
  fallbackImage={fallbackImage}
  banner={banner}
/>

      <section className="benefits">
        <div>
          <span><FiCheck aria-hidden="true" /></span>
          <p><b>100% Authentic</b>Verified products only</p>
        </div>
        <div>
          <span><FiZap aria-hidden="true" /></span>
          <p><b>Swift delivery</b>Same-day in Kanpur</p>
        </div>
        <div>
          <span><FiRefreshCw aria-hidden="true" /></span>
          <p><b>Easy returns</b>7-day return policy</p>
        </div>
        <div>
          <span><FiLock aria-hidden="true" /></span>
          <p><b>Secure checkout</b>UPI, cards & COD</p>
        </div>
      </section>

      <section
  className="section category-section"
  id="categories"
>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Categories</span>
            <h2>Find your ritual</h2>
          </div>
          <button type="button" onClick={showAllProducts}>
            View all <FiArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="categories">
          <button
            type="button"
            className={`category-card ${
              activeCategory === "All" && activeDeal === "none" ? "active" : ""
            }`}
            onClick={showAllProducts}
          >
            <span className="category-icon category-all">All</span>
            <b>All</b>
          </button>

          {categories.map((category) => (
            <button
              type="button"
              className={`category-card ${
                activeCategory === category.name ? "active" : ""
              }`}
              key={category.name}
              onClick={() => showCategory(category.name)}
            >
              <span
                className="category-icon"
                style={{ background: category.color }}
              >
              <div className="category-icon-inner">
  {category.emoji}
</div>
              </span>
              <b>{category.label || category.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="section price-deals-section" id="price-deals">
        <div className="section-heading">
          <div>
            <span className="eyebrow">By price</span>
            <h2>Luxury for less</h2>
          </div>

          {activeDeal !== "none" && (
            <button type="button" onClick={showAllProducts}>
              Clear filter <FiArrowRight aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="price-deal-grid">
          <button
            type="button"
            className={`price-deal-banner deal-99 ${
              activeDeal === "99" ? "active" : ""
            }`}
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
            className={`price-deal-banner deal-199 ${
              activeDeal === "199" ? "active" : ""
            }`}
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

      <section className="section products-section" id="products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {activeDeal === "none" ? "Trending" : "Special offers"}
            </span>
            <h2>
              {activeDeal === "99"
                ? "The ₹99 collection"
                : activeDeal === "199"
                  ? "The ₹199 collection"
                  : "Our favourites"}
            </h2>
          </div>
          <button type="button" onClick={showAllProducts}>
            See all <FiArrowRight aria-hidden="true" />
          </button>
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
            <button type="button" className="secondary-button" onClick={loadProducts}>
              Try again
            </button>
          </div>
        )}

        {!loadingProducts && !productsError && (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              const discount =
                product.originalPrice > product.price
                  ? Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )
                  : 0;

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    {(product.dealType !== "none" || product.badge) && (
                      <span className="product-badge">
                        {product.dealType === "99"
                          ? "₹99"
                          : product.dealType === "199"
                            ? "₹199"
                            : product.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`wishlist ${isWishlisted ? "selected" : ""}`}
                      onClick={() => toggleWishlist(product)}
                      aria-label={
                        isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                      }
                    >
                      {isWishlisted ? "♥" : "♡"}
                    </button>
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.src = fallbackImage;
                        }}
                      />
                    </Link>
                  </div>

                  <div className="product-info">
                    <p className="brand-name">{product.brand}</p>
                    <h3>
                      <Link to={`/product/${product.id}`}>{product.name}</Link>
                    </h3>
                    <div className="rating">
                      <b>★ {product.rating}</b>
                      <span>({product.reviews})</span>
                    </div>
                    <div className="price-row">
                      <strong>₹{product.price}</strong>
                      <del>₹{product.originalPrice}</del>
                      {discount > 0 && <span>{discount}% off</span>}
                    </div>
                    {product.marketplaceLinks.length > 0 && (
                      <div className="market-price-box">
                        <span>Compare price</span>
                        <div className="market-links">
                          {product.marketplaceLinks.map((link) => (
                            <a
                              key={`${product.id}-${link.platform}-${link.url}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Check ${product.name} price on ${link.platform}`}
                            >
                              {link.platform} ↗
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      className="add-button"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock <= 0 ? "Out of stock" : "Add to bag"}
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
    </main>
  );
}
