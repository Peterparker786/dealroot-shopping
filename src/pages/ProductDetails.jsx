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

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(true);


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
image:
  data.product.images?.[0] || fallbackImage,
        stock: data.product.stock,
        description: data.product.description || "",
        deliveryDate: getEstimatedDelivery(),
        marketplaceLinks: data.product.marketplaceLinks || [],
      });
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
  <section
    style={{
      padding: "50px 8%",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "50px",
      alignItems: "start",
    }}
  >
    {/* Left Side */}
    <div>
      <img
        src={product.image}
        alt={product.name}
        style={{
          width: "100%",
          borderRadius: "20px",
        }}
      />
    </div>

    {/* Right Side */}
    <div>
      <h1>{product.name}</h1>

      <h3>{product.brand}</h3>

      <p>
       ⭐ {Number(product.rating).toFixed(1)} ({product.reviews} Reviews)
      </p>

      <h2>₹{product.price}</h2>
      <div
  style={{
    background: "#f8f9fa",
    borderRadius: "12px",
    padding: "15px",
    margin: "20px 0",
  }}
>
  <div style={{ fontWeight: "700" }}>
    🚚 FREE Delivery
  </div>

  <div style={{ marginTop: "6px" }}>
    Estimated Delivery:
    <strong> {product.deliveryDate}</strong>
  </div>
</div>

      <p
        style={{
          textDecoration: "line-through",
          color: "#888",
        }}
      >
        ₹{product.originalPrice}
      </p>

      <p>{product.description}</p>

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

      <button onClick={() => addToCart(product)}>
        Add To Cart
      </button>

      <button
        style={{ marginLeft: "10px" }}
        onClick={() => toggleWishlist(product)}
      >
        {wishlist.includes(product.id)
          ? "♥ Wishlisted"
          : "♡ Wishlist"}
      </button>

      <div style={{ marginTop: 20 }}>
        {product.marketplaceLinks.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            style={{ marginRight: "10px" }}
          >
            <button>Buy on {link.platform}</button>
          </a>
        ))}
      </div>
    </div>

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