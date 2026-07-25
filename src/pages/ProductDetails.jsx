import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
export default function ProductDetails({
  apiUrl,
  addToCart,
  toggleWishlist,
  wishlist,
  fallbackImage,
  showToast,
}) {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
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
        image: data.product.image || fallbackImage,
        stock: data.product.stock,
        description: data.product.description || "",
        marketplaceLinks: data.product.marketplaceLinks || [],
      });
    } catch {
      showToast("Product not found");
    } finally {
      setLoading(false);
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
        ⭐ {product.rating} ({product.reviews} Reviews)
      </p>

      <h2>₹{product.price}</h2>

      <p
        style={{
          textDecoration: "line-through",
          color: "#888",
        }}
      >
        ₹{product.originalPrice}
      </p>

      <p>{product.description}</p>

      <p>
        <strong>Stock:</strong>{" "}
        {product.stock > 0 ? "✅ In Stock" : "❌ Out of Stock"}
      </p>

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
            <button>
              Buy on {link.platform}
            </button>
          </a>
        ))}
      </div>
    </div>
  </section>
);
}