import { useState } from "react";
import { optimizeImage } from "./utils/cloudinary";

function CartDrawer({
  isOpen,
  onClose,
  cart,
  setCart,
  showToast,
  giftProducts = [],
  onCheckout,
}) {
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Free gift offer: cart ₹499+ unlocks one product worth up to ₹99 free.
  const FREE_GIFT_MIN = 499;
  const FREE_GIFT_MAX_PRICE = 99;
  const giftEligible = subtotal >= FREE_GIFT_MIN;
  const giftChoices = giftProducts.filter(
    (p) => p.price <= FREE_GIFT_MAX_PRICE && Number(p.stock) > 0
  );
  const giftProduct = cart.find((item) => item.isFreeGift) || null;

  const updateQuantity = (id, change) => {
  setCart((currentCart) =>
    currentCart
      .map((item) => {
        if (item.id !== id) return item;

        const nextQuantity = item.quantity + change;

        return {
          ...item,
          quantity: Math.max(
            0,
            Math.min(nextQuantity, item.stock)
          ),
        };
      })
      .filter((item) => item.quantity > 0)
  );
};

  const removeItem = (id) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
    showToast("Item removed from cart");
  };

  const checkout = () => {
    if (!cart.length) {
      showToast("Your cart is empty");
      return;
    }

  onCheckout(); 
  };

  return (
    <>
      {isOpen && <button className="cart-overlay" onClick={onClose} />}

      <aside className={`cart-drawer ${isOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <div>
            <span className="eyebrow blue">YOUR BAG</span>
            <h2>Shopping Cart</h2>
          </div>
          <button className="drawer-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {!cart.length ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">BAG</div>
            <h3>Your cart is empty</h3>
            <p>Add your beauty favourites and they will appear here.</p>
            <button className="primary-button" onClick={onClose}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) =>
                item.isFreeGift ? (
                  <div className="cart-item cart-free-gift" key={item.id}>
                    <img
                      src={optimizeImage(item.image, 200)}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />

                    <div className="cart-item-info">
                      <p>{item.brand}</p>
                      <h3>{item.name}</h3>
                      <strong className="gift-free-tag">FREE 🎁</strong>

                      <div className="quantity-row">
                        <button
                          className="remove-item"
                          onClick={() =>
                            setCart((currentCart) =>
                              currentCart.filter((gift) => !gift.isFreeGift)
                            )
                          }
                        >
                          Remove gift
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="cart-item" key={item.id}>
                  <img
                    src={optimizeImage(item.image, 200)}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                  />

                  <div className="cart-item-info">
                    <p>{item.brand}</p>
                    <h3>{item.name}</h3>
                    <strong>₹{item.price}</strong>

                    <div className="quantity-row">
                      <div className="quantity-control">

  <button
    onClick={() => updateQuantity(item.id, -1)}
  >
    −
  </button>

  <b>{item.quantity}</b>

  <button
    disabled={item.quantity >= item.stock}
    onClick={() => updateQuantity(item.id, 1)}
  >
    +
  </button>

</div>

                      <button
                        className="remove-item"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                )
              )}
            </div>

            {/* Free gift banner / picker (₹499+ carts) */}
            <div className={`cart-gift-box ${giftEligible ? "unlocked" : "locked"}`}>
              {!giftEligible ? (
                <p>
                  🎁 Add ₹{FREE_GIFT_MIN - subtotal} more to unlock a <b>FREE gift</b>
                </p>
              ) : giftProduct ? (
                <p>
                  🎁 Free gift added: <b>{giftProduct.name}</b>
                </p>
              ) : (
                <>
                  <p>
                    🎉 Congratulations! Pick your <b>FREE gift</b> (worth up to ₹{FREE_GIFT_MAX_PRICE}):
                  </p>

                  <button
                    type="button"
                    className="cart-gift-toggle"
                    onClick={() => setGiftPickerOpen((v) => !v)}
                  >
                    {giftPickerOpen ? "Hide gift options ▲" : "Choose free gift ▼"}
                  </button>

                  {giftPickerOpen && (
                    <div className="cart-gift-list">
                      {giftChoices.length === 0 ? (
                        <small>No gifts available right now.</small>
                      ) : (
                        giftChoices.map((p) => (
                          <button
                            type="button"
                            className="cart-gift-option"
                            key={p.id}
                            onClick={() => {
                              setCart((currentCart) => [
                                ...currentCart.filter((gift) => !gift.isFreeGift),
                                {
                                  id: `gift-${p.id}`,
                                  productId: p.id,
                                  name: p.name,
                                  brand: p.brand,
                                  price: 0,
                                  image: p.image,
                                  quantity: 1,
                                  stock: p.stock,
                                  isFreeGift: true,
                                },
                              ]);
                              setGiftPickerOpen(false);
                              showToast(`🎁 ${p.name} added as your FREE gift!`);
                            }}
                          >
                            <img
                              src={optimizeImage(p.image, 100)}
                              alt={p.name}
                              loading="lazy"
                            />
                            <span className="cart-gift-option-info">
                              <b>{p.name}</b>
                              <small>
                                {p.brand} · <s>₹{p.price}</s> ₹0
                              </small>
                            </span>
                            <span className="cart-gift-pick">FREE</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <b>₹{subtotal}</b>
              </div>
              <div>
  <span>Delivery</span>
  <b>Calculated at checkout</b>
</div>

<p>
  {subtotal < 499
    ? `Add ₹${499 - subtotal} more for free delivery`
    : "You unlocked free delivery"}
</p>

<div className="cart-total">

  <span>Total ({cart.length} Items)</span>

  <strong>₹{subtotal}</strong>

</div>
              <button className="primary-button checkout-button" onClick={checkout}>
                Proceed to checkout
              </button>

              <div className="cart-trust-badges">
                <div className="cart-trust-row">
                  <span className="cart-trust-item">💳 UPI</span>
                  <span className="cart-trust-item">💳 Visa</span>
                  <span className="cart-trust-item">💳 Mastercard</span>
                  <span className="cart-trust-item">💵 COD</span>
                </div>
                <div className="cart-trust-row">
                  <span className="cart-trust-item">🔒 SSL Secured</span>
                  <span className="cart-trust-item">✅ Genuine</span>
                  <span className="cart-trust-item">↩️ Easy Returns</span>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;