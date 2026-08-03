import "./ProductDetails.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
export default function ProductDetails({
  apiUrl,
  addToCart,
  toggleWishlist,
  wishlist,
  fallbackImage,
  showToast,
  user,
}) {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(true);
const [quantity, setQuantity] = useState(1);

useEffect(() => {
  if (!product?.images?.length) return;

  const interval = setInterval(() => {
    const currentIndex = product.images.indexOf(selectedImage);

    const nextIndex =
      currentIndex === product.images.length - 1
        ? 0
        : currentIndex + 1;

    setSelectedImage(product.images[nextIndex]);
  }, 3000);

  return () => clearInterval(interval);
}, [product, selectedImage]);

  function getEstimatedDelivery() {
  const today = new Date();

  const start = new Date(today);
  start.setDate(today.getDate() + 2);

  const end = new Date(today);
  end.setDate(today.getDate() + 4);

  const options = {
    day: "numeric",
    month: "short",
  };

  return `${start.toLocaleDateString(
    "en-IN",
    options
  )} - ${end.toLocaleDateString(
    "en-IN",
    options
  )}`;
}

 useEffect(() => {
  loadProduct();
  loadReviews();
}, [id]);

  async function loadProduct() {
    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/api/products/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error();
      }

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
});

setSelectedImage(
  data.product.images?.[0] ||
  data.product.image ||
  fallbackImage
);

    } catch {
      showToast("Product not found");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
  try {
    setReviewsLoading(true);

    const response = await fetch(
      `${apiUrl}/api/reviews/${id}`
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setReviews(data.reviews);
    }
  } catch {
    setReviews([]);
  } finally {
    setReviewsLoading(false);
  }
}

  if (loading) {
    return (
      <div style={{ padding: 60 }}>
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 60 }}>
        Product not found.
      </div>
    );
  }
   return (
<section className="product-page">
    {/* Left Side */}
  <div className="product-left">
  <img
    src={selectedImage}
    alt={product.name}
    className="product-image"
  />

  {product.images?.length > 1 && (
    <div className="thumbnail-gallery">
      {product.images.map((img, index) => (
        <img
  key={index}
  src={img}
  alt=""
  onClick={() => setSelectedImage(img)}
  className={`thumbnail ${
    selectedImage === img ? "active-thumb" : ""
  }`}
/>
      ))}
    </div>
  )}
</div>

    {/* Right Side */}
    {/* Right Side */}
<div className="product-right">
   <div className="premium-badge">
  ✨ Premium Beauty Collection
</div>
  <h1 className="product-title">
    {product.name}
  </h1>
 

  <div className="brand-name">
    {product.brand}
  </div>

  <div className="rating-box">

    <div className="stars">
      ⭐ {Number(product.rating).toFixed(1)}
    </div>

    <div className="review-count">
      ({product.reviews} Reviews)
    </div>

  </div>

  <div className="price-box">

    <div className="sale-price">
      ₹{product.price}
    </div>

    <div className="mrp-price">
      ₹{product.originalPrice}
    </div>

    <div className="discount-badge">
      50% OFF
    </div>
    <div className="price-note">
Inclusive of all taxes
</div>

  </div>

      <div style={{ margin: "18px 0", fontSize: "16px", fontWeight: "600" }}>
  {product.stock === 0 && (
    <span style={{ color: "#d32f2f" }}>
      ❌ Out of Stock
    </span>
  )}

  {product.stock > 0 && product.stock <= 5 && (
    <span style={{ color: "#d32f2f" }}>
      🔥 Only {product.stock} left in stock
    </span>
  )}

  {product.stock > 5 && product.stock <= 10 && (
    <span style={{ color: "#ff9800" }}>
      ⚠ Limited Stock ({product.stock} left)
    </span>
  )}

  {product.stock > 10 && (
    <span style={{ color: "#2e7d32" }}>
      ✅ In Stock
    </span>
  )}
</div>
<div className="quantity-box">
  <span>Quantity</span>

  <div className="qty-controls">
    <button
      onClick={() =>
        setQuantity((q) => Math.max(1, q - 1))
      }
    >
      −
    </button>

    <strong>{quantity}</strong>

    <button
      onClick={() =>
        setQuantity((q) => q + 1)
      }
    >
      +
    </button>
  </div>
</div>

<div className="product-actions">

  <button
    className="buy-now-btn"
    onClick={() => addToCart(product, quantity)}
  >
    ⚡ BUY NOW
    <span>Get it delivered to your doorstep</span>
  </button>

  <button
    className="cart-btn"
    onClick={() => addToCart(product, quantity)}
  >
    🛒 ADD TO CART
    <span>Secure Checkout</span>
  </button>

  <button
    className="wishlist-btn"
    onClick={() => toggleWishlist(product)}
  >
    {wishlist.includes(product.id)
      ? "❤️ Wishlisted"
      : "🤍 Add To Wishlist"}
  </button>

</div>
<div className="offer-strip">

🎁 Extra 10% OFF on prepaid orders

</div>

<div className="delivery-card">

  <div style={{ fontWeight: "700" }}>
    🚚 FREE Delivery
  </div>

  <div style={{ marginTop: "6px" }}>
    Estimated Delivery:
    <strong> {product.deliveryDate}</strong>
  </div>

</div>

<div className="description-box">
  <h3>About this Product</h3>
  <p>{product.description}</p>
</div>

<div className="trust-badges">

  <div className="trust-item">
    🛡️ 100% Genuine Product
  </div>

  <div className="trust-item">
    🚚 Fast Delivery
  </div>

  <div className="trust-item">
    🔒 Secure Payment
  </div>

  <div className="trust-item">
    ↩️ Easy Returns
  </div>

</div>

<div style={{ marginTop: 20 }}>
  {product.marketplaceLinks.map((link) => (
    <a
      key={link.platform}
      href={link.url}
      target="_blank"
      rel="noreferrer"
      style={{ marginRight: "10px" }}
    >
      <button
  style={{
    padding: "12px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#6c2bd9",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "10px",
  }}
>
  Market price on {link.platform}
</button>
    </a>
  ))}
</div>

</div> {/* product-right ends here */}
    {/* Customer Reviews */}

    {/* Customer Reviews */}
    <div
      style={{
        gridColumn: "1 / -1",
        marginTop: "50px",
      }}
    >
      <h2>Customer Reviews</h2>

      {reviewsLoading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div
            key={review._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 20,
              marginTop: 15,
            }}
          >
            <h4>{review.user?.name}</h4>

            <div>
              {"⭐".repeat(review.rating)}
            </div>

            <p>{review.review}</p>

            {review.verifiedPurchase && (
              <small
                style={{
                  color: "green",
                  fontWeight: "bold",
                }}
              >
                ✔ Verified Purchase
              </small>
            )}
          </div>
        ))
      )}
    </div>

  </section>
);
}
