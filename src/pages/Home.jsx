import { Link } from "react-router-dom";
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
}) {
  return (
    <>
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
              <button
                className="text-button"
                onClick={() =>
                  document
                    .getElementById("price-deals")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
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
            <button onClick={showAllProducts}>View all →</button>
          </div>

          <div className="categories">
            <button
              className={`category-card ${
                activeCategory === "All" && activeDeal === "none" ? "active" : ""
              }`}
              onClick={showAllProducts}
            >
              <span style={{ background: "#E5EDFF" }}>★</span><b>All Deals</b>
            </button>

            {categories.map((category) => (
              <button
                className={`category-card ${
                  activeCategory === category.name ? "active" : ""
                }`}
                key={category.name}
                onClick={() => showCategory(category.name)}
              >
                <span style={{ background: category.color }}>{category.emoji}</span>
                <b>{category.label || category.name}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="section price-deals-section" id="price-deals">
          <div className="section-heading">
            <div>
              <span className="eyebrow blue">SHOP BY PRICE</span>
              <h2>Big beauty finds. Tiny prices.</h2>
            </div>

            {activeDeal !== "none" && (
              <button onClick={showAllProducts}>Clear deal filter →</button>
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
              <span>DEALROOT PICKS</span>
              <strong>₹99</strong>
              <div>
                <h3>Deals Store</h3>
                <p>Beauty essentials at just ₹99</p>
              </div>
              <b>SHOP NOW →</b>
            </button>

            <button
              type="button"
              className={`price-deal-banner deal-199 ${
                activeDeal === "199" ? "active" : ""
              }`}
              onClick={() => showDeal("199")}
            >
              <span>MORE VALUE</span>
              <strong>₹199</strong>
              <div>
                <h3>Deals Store</h3>
                <p>Premium favourites at just ₹199</p>
              </div>
              <b>SHOP NOW →</b>
            </button>
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
              <span className="eyebrow blue">
                {activeDeal === "none" ? "TRENDING NOW" : "SPECIAL PRICE STORE"}
              </span>
              <h2>
                {activeDeal === "99"
                  ? "Everything in the ₹99 Deals Store"
                  : activeDeal === "199"
                    ? "Everything in the ₹199 Deals Store"
                    : "Beauty favourites at better prices"}
              </h2>
            </div>
            <button onClick={showAllProducts}>See all products →</button>
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
                        {(product.dealType !== "none" || product.badge) && (
                          <span className="product-badge">
                            {product.dealType === "99"
                              ? "₹99 DEAL"
                              : product.dealType === "199"
                                ? "₹199 DEAL"
                                : product.badge}
                          </span>
                        )}
                        <button
                          className={`wishlist ${isWishlisted ? "selected" : ""}`}
                          onClick={() => toggleWishlist(product)}
                        >
                          {isWishlisted ? "♥" : "♡"}
                        </button>
                       <Link
  to={`/product/${product.id}`}
  style={{ display: "block" }}
>
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
  <Link
    to={`/product/${product.id}`}
    style={{
      textDecoration: "none",
      color: "inherit",
    }}
  >
    {product.name}
  </Link>
</h3>
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
    </>
  );
}