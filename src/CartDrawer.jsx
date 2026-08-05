import { optimizeImage } from "./utils/cloudinary";

function CartDrawer({
  isOpen,
  onClose,
  cart,
  setCart,
  showToast,
  onCheckout,
}) {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

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
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={optimizeImage(item.image, 200)} alt={item.name} />

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
              ))}
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
              <small>Secure checkout • COD and online payment available</small>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;