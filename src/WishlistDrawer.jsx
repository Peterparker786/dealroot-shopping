import { optimizeImage } from "./utils/cloudinary";

function WishlistDrawer({ isOpen, onClose, products, onRemove, addToCart }) {
  return (
    <>
      {isOpen && (
        <button
          className="cart-overlay"
          onClick={onClose}
          aria-label="Close wishlist"
        />
      )}

      <aside className={`cart-drawer ${isOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <div>
            <span className="h-label" style={{ color: "var(--brand)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>
              YOUR WISHLIST
            </span>
            <h2>Wishlist ({products.length})</h2>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close wishlist">
            &times;
          </button>
        </div>

        {!products.length ? (
          <div className="empty-cart">
            <div className="empty-cart-icon" style={{ fontSize: 24 }}>♥</div>
            <h3>Your wishlist is empty</h3>
            <p>Tap the ♡ on any product to save it here.</p>
            <button className="hero-btn-primary" onClick={onClose}>
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="cart-items">
            {products.map((product) => (
              <div className="cart-item" key={product.id}>
                <img src={optimizeImage(product.image, 200)} alt={product.name} />

                <div className="cart-item-info">
                  <p>{product.brand}</p>
                  <h3>{product.name}</h3>
                  <strong>₹{product.price}</strong>

                  <div className="quantity-row">
                    <button
                      className="wishlist-add-btn"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>

                    <button
                      className="remove-item"
                      onClick={() => onRemove(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}

export default WishlistDrawer;