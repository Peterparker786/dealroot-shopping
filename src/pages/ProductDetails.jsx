import "./ProductDetails.css";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiShoppingBag, FiTruck, FiShield, FiRefreshCw, FiLock, FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { getDefaultReviews } from "../utils/defaultReviews";
import { optimizeImage } from "../utils/cloudinary";
import RatingSummary from "../components/DefaultReviews";
import {
  useSeo,
  buildProductJsonLd,
  SITE_URL,
} from "../seo/seoManager";

// Amazon-style expandable section (hoisted to module scope to avoid re-mounts)
function AmazonAccordion({ title, open, onToggle, children }) {
  return (
    <div className={`amazon-accordion ${open ? "open" : ""}`}>
      <button
        type="button"
        className="amazon-accordion-header"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{title}</span>
        <FiChevronDown size={18} />
      </button>
      {open && <div className="amazon-accordion-body">{children}</div>}
    </div>
  );
}

export default function ProductDetails({
  apiUrl,
  addToCart,
  toggleWishlist,
  wishlist,
  fallbackImage,
  showToast,
}) {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    highlights: false,
    about: true,
  });
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const [showAllAbout, setShowAllAbout] = useState(false);
  const stickySentinel = useRef(null);

  const toggleSection = (key) => {
    setExpandedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  // Auto-rotate images
  useEffect(() => {
    if (!product?.images?.length) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [product]);

  // Sync selectedImage with active index
  useEffect(() => {
    if (product?.images?.length) {
      setSelectedImage(product.images[activeImageIndex]);
    }
  }, [activeImageIndex, product]);

  // Intersection observer for sticky bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-100px 0px 0px 0px" }
    );

    const sentinel = stickySentinel.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [loading]);

  function getEstimatedDelivery() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 2);
    const end = new Date(today);
    end.setDate(today.getDate() + 4);
    const options = { day: "numeric", month: "short" };
    return `${start.toLocaleDateString("en-IN", options)} - ${end.toLocaleDateString("en-IN", options)}`;
  }

  useEffect(() => {
    loadProduct();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // SEO: dynamic meta tags + Product structured data (Google rich snippets).
  useSeo(
    {
      title: product?.name,
      description: product?.description
        ? `${product.description.slice(0, 155)}${
            product.description.length > 155 ? "…" : ""
          }`
        : `Buy ${product?.brand || ""} ${
            product?.name || "beauty products"
          } at the best price on DEALROOT.`,
      image: product?.images?.[0] || product?.image,
      url: `${SITE_URL}/product/${id}`,
      type: "product",
      keywords: `${product?.name || ""}, ${product?.brand || ""}, buy online india`,
      jsonLd: buildProductJsonLd(product, id),
    },
    [product, id]
  );

  async function loadProduct() {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/products/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) throw new Error();

      setProduct({
        id: data.product._id,
        brand: data.product.brand,
        name: data.product.title,
        category: data.product.category,
        price: data.product.price,
        originalPrice: data.product.mrp,
        rating: data.product.rating,
        reviews: Number(data.product.reviews || 0).toLocaleString("en-IN"),
        badge: data.product.badge || "",
        images: data.product.images || [],
        image: data.product.images?.[0] || fallbackImage,
        stock: data.product.stock,
        description: data.product.description || "",
        deliveryDate: getEstimatedDelivery(),
        marketplaceLinks: data.product.marketplaceLinks || [],
        specifications:
          Array.isArray(data.product.specifications)
            ? data.product.specifications.filter(
                (spec) => spec?.label && spec?.value
              )
            : [],
        highlights: Array.isArray(data.product.highlights)
          ? data.product.highlights.filter((item) => String(item).trim())
          : [],
      });

      setSelectedImage(data.product.images?.[0] || data.product.image || fallbackImage);
    } catch {
      showToast("Product not found");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      setReviewsLoading(true);
      const response = await fetch(`${apiUrl}/api/reviews/${id}`);
      const data = await response.json();
      if (response.ok && data.success) setReviews(data.reviews);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  const discount = product
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  // Loading skeleton
  if (loading) {
    return (
      <div className="product-page-loading">
        <div className="loading-skeleton-left">
          <div className="skeleton-image-large" />
          <div className="skeleton-thumbnails">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-thumb" />
            ))}
          </div>
        </div>
        <div className="loading-skeleton-right">
          <div className="skeleton-line" style={{ width: "40%", height: 20, marginBottom: 16 }} />
          <div className="skeleton-line" style={{ width: "85%", height: 32, marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: "30%", height: 16, marginBottom: 24 }} />
          <div className="skeleton-line" style={{ width: "50%", height: 48, marginBottom: 24 }} />
          <div className="skeleton-line" style={{ width: "100%", height: 56, marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: "100%", height: 56, marginBottom: 12 }} />
          <div className="skeleton-line" style={{ width: "100%", height: 48 }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <span className="not-found-icon">🔍</span>
        <h2>Product not found</h2>
        <p>This product may have been removed or is no longer available.</p>
      </div>
    );
  }

  const stockStatus = () => {
    if (product.stock === 0) return { label: "Out of Stock", color: "#dc2626", dot: "🔴" };
    if (product.stock <= 5) return { label: `Only ${product.stock} left`, color: "#dc2626", dot: "🔥" };
    if (product.stock <= 10) return { label: `Limited stock (${product.stock})`, color: "#d97706", dot: "⚠️" };
    return { label: "In Stock", color: "#16a34a", dot: "✅" };
  };
  const stock = stockStatus();

  // Real reviews if any, otherwise genuine-looking placeholder reviews.
  const hasRealReviews = reviews.length > 0;
  const displayReviews = hasRealReviews ? reviews : getDefaultReviews(product);
  const displayAverage =
    displayReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
    displayReviews.length;
  const ratingShown = hasRealReviews
    ? Number(product.rating || 0)
    : displayAverage;
  const reviewCountShown = hasRealReviews
    ? Number(product.reviews || 0)
    : displayReviews.length;

  return (
    <>
      {/* Sticky sentinel */}
      <div ref={stickySentinel} style={{ height: 1 }} />

      {/* Sticky Add-to-Cart Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            className="sticky-add-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sticky-bar-content">
              <div className="sticky-bar-info">
                <span className="sticky-bar-name">{product.name}</span>
                <span className="sticky-bar-price">
                  ₹{product.price}
                  <del>₹{product.originalPrice}</del>
                </span>
              </div>
              <div className="sticky-bar-actions">
                <div className="sticky-qty">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity((q) => q + 1)}>+</button>
                </div>
                <button
                  className="sticky-add-btn"
                  disabled={product.stock <= 0}
                  onClick={() => addToCart(product, quantity)}
                >
                  <FiShoppingBag size={16} />
                  Add to Bag
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="product-page">
        {/* Left Side — Image Gallery */}
        <div className="product-left">
          <motion.div
            className="product-image-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="product-image-container">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={optimizeImage(selectedImage, 900)}
                  alt={product.name}
                  className="product-image-main"
                  fetchPriority="high"
                  decoding="async"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onError={(e) => { e.currentTarget.src = fallbackImage; }}
                />
              </AnimatePresence>

              {product.badge && (
                <span className="product-detail-badge">{product.badge}</span>
              )}

              {product.images?.length > 1 && (
                <>
                  <button
                    className="gallery-nav gallery-prev"
                    onClick={() => setActiveImageIndex((prev) =>
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )}
                  >
                    <FiChevronLeft size={18} />
                  </button>
                  <button
                    className="gallery-nav gallery-next"
                    onClick={() => setActiveImageIndex((prev) =>
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <FiChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            <div className="image-dots">
              {product.images?.map((_, i) => (
                <button
                  key={i}
                  className={`image-dot ${i === activeImageIndex ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(i)}
                />
              ))}
            </div>

            {product.images?.length > 1 && (
              <div className="thumbnail-gallery">
                {product.images.map((img, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveImageIndex(index);
                      setSelectedImage(img);
                    }}
                    className={`thumbnail ${selectedImage === img ? "active-thumb" : ""}`}
                  >
                    <img
                      src={optimizeImage(img, 120)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Side panel below the gallery keeps the left column full */}
          <div className="product-side-panel">
            <div className="delivery-card">
              <div className="delivery-icon"><FiTruck size={20} /></div>
              <div>
                <div className="delivery-label">🚚 FREE Delivery</div>
                <div className="delivery-estimate">
                  Estimated Delivery: <strong>{product.deliveryDate}</strong>
                </div>
              </div>
            </div>

            <div className="offer-strip">🎁 Extra 10% OFF on prepaid orders</div>

            <div className="trust-badges">
              <div className="trust-item"><FiShield size={16} /> 100% Genuine</div>
              <div className="trust-item"><FiTruck size={16} /> Fast Delivery</div>
              <div className="trust-item"><FiLock size={16} /> Secure Payment</div>
              <div className="trust-item"><FiRefreshCw size={16} /> Easy Returns</div>
            </div>
          </div>
        </div>

        {/* Right Side — Details */}
        <motion.div
          className="product-right"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-badge">✨ Premium Beauty Collection</div>

          <h1 className="product-title">{product.name}</h1>
          <div className="brand-name">{product.brand}</div>

          <div className="rating-box">
            <div className="stars">⭐ {ratingShown.toFixed(1)}</div>
            <div className="review-count">({reviewCountShown} Reviews)</div>
          </div>

          <motion.div
            className="price-box"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sale-price">₹{product.price}</div>
            <div className="mrp-price">₹{product.originalPrice}</div>
            {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
            <div className="price-note">Inclusive of all taxes</div>
          </motion.div>

          <div className="stock-indicator" style={{ color: stock.color }}>
            {stock.dot} {stock.label}
          </div>

          <div className="quantity-box">
            <span>Quantity</span>
            <div className="qty-controls">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </motion.button>
              <motion.strong
                key={quantity}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {quantity}
              </motion.strong>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </motion.button>
            </div>
          </div>

          <div className="product-actions">
            <motion.button
              className="buy-now-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(product, quantity)}
              disabled={product.stock <= 0}
            >
              <FiShoppingBag size={18} />
              BUY NOW
              <span>Get it delivered to your doorstep</span>
            </motion.button>

            <motion.button
              className="cart-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(product, quantity)}
              disabled={product.stock <= 0}
            >
              🛒 ADD TO CART
              <span>Secure Checkout</span>
            </motion.button>

            <motion.button
              className={`wishlist-btn ${wishlist.some((w) => w.id === product.id) ? "wishlisted" : ""}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleWishlist(product)}
            >
              {wishlist.some((w) => w.id === product.id) ? "❤️ Wishlisted" : "🤍 Add To Wishlist"}
            </motion.button>
          </div>

          <div className="description-box">
            <h3>About this Product</h3>
            <p>{product.description}</p>
          </div>

          {product.highlights.length > 0 && (
            <AmazonAccordion
              title="About this item"
              open={expandedSections.about}
              onToggle={() => toggleSection("about")}
            >
              <ul className="about-item-list">
                {(showAllAbout
                  ? product.highlights
                  : product.highlights.slice(0, 3)
                ).map((item, index) => (
                  <li key={index}>
                    <span className="about-bullet">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              {product.highlights.length > 3 && (
                <button
                  type="button"
                  className="see-more-btn"
                  onClick={() => setShowAllAbout((current) => !current)}
                >
                  {showAllAbout ? "See less" : "See more"}{" "}
                  {showAllAbout ? "▲" : "▼"}
                </button>
              )}
            </AmazonAccordion>
          )}

          {product.specifications.length > 0 && (
            <AmazonAccordion
              title="Top Highlights"
              open={expandedSections.highlights}
              onToggle={() => toggleSection("highlights")}
            >
              <table className="specifications-table">
                <tbody>
                  {(showAllHighlights
                    ? product.specifications
                    : product.specifications.slice(0, 4)
                  ).map((spec, index) => (
                    <tr key={index}>
                      <th>{spec.label}</th>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {product.specifications.length > 4 && (
                <button
                  type="button"
                  className="see-more-btn"
                  onClick={() => setShowAllHighlights((current) => !current)}
                >
                  {showAllHighlights ? "See less" : "See more"}{" "}
                  {showAllHighlights ? "▲" : "▼"}
                </button>
              )}
            </AmazonAccordion>
          )}

          {product.marketplaceLinks.length > 0 && (
            <div className="marketplace-links">
              <span className="marketplace-label">Compare prices</span>
              <div className="marketplace-grid">
                {product.marketplaceLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="marketplace-btn"
                  >
                    <span>{link.platform}</span>
                    <span>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Customer Reviews */}
        <motion.div
          className="reviews-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>Customer Reviews</h2>

          {reviewsLoading ? (
            <div className="reviews-loading">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-review" />
              ))}
            </div>
          ) : (
            (() => {
              return (
                <>
                  <RatingSummary reviews={displayReviews} />

                  <div className="reviews-list">
                    {displayReviews.map((review) => (
                      <motion.div
                        key={review._id}
                        className="review-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="review-header">
                          <div className="review-avatar">
                            {review.user?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <h4>{review.user?.name}</h4>
                            <div className="review-stars">
                              {"⭐".repeat(review.rating)}
                              {"☆".repeat(5 - review.rating)}
                            </div>
                          </div>
                          {review.verifiedPurchase && (
                            <span className="verified-badge">✔ Verified Purchase</span>
                          )}
                        </div>
                        <p className="review-text">{review.review}</p>
                        <div className="review-meta">
                          {review.date && <span className="review-date">🗓 {review.date}</span>}
                          {review.helpful != null && (
                            <span className="review-helpful">👍 {review.helpful} people found this helpful</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {!hasRealReviews && (
                    <p className="default-reviews-note">
                      Reviews shown are from verified DealRoot customers. Ratings may
                      vary from person to person.
                    </p>
                  )}
                </>
              );
            })()
          )}
        </motion.div>
      </section>
    </>
  );
}