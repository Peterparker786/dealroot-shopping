import { useState } from "react";

const API_URL = "https://dealroot-backend.onrender.com/api";

function CheckoutModal({
  isOpen,
  onClose,
  cart = [],
  total = 0,
  showToast,
  onOrderPlaced,
}) {
  const [deliveryType, setDeliveryType] = useState("courier");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "Kanpur",
    pincode: "",
  });

  if (!isOpen) return null;

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    const phone = form.phone.replace(/\D/g, "");
    const pincode = form.pincode.replace(/\D/g, "");

    if (!form.name.trim() || !phone || !form.address.trim() || !pincode) {
      showToast?.("Please complete your delivery details");
      return;
    }

    if (phone.length !== 10) {
      showToast?.("Please enter a valid 10-digit mobile number");
      return;
    }

    if (pincode.length !== 6) {
      showToast?.("Please enter a valid 6-digit pincode");
      return;
    }

    if (!cart.length) {
      showToast?.("Your cart is empty");
      return;
    }

    if (paymentMethod === "online") {
      showToast?.("Online payment will be available soon. Please choose Cash on Delivery.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone,
            address: form.address.trim(),
            city: form.city.trim() || "Kanpur",
            pincode,
          },
          items: cart.map((item) => ({
            productId: item._id || item.id,
            quantity: item.quantity,
          })),
          deliveryType,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not place your order");
      }

      setPlacedOrder(data.order);
      onOrderPlaced?.(data.order);
    } catch (error) {
      showToast?.(error.message || "Could not place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCheckout = () => {
    setPlacedOrder(null);
    onClose();
  };

  if (placedOrder) {
    return (
      <div className="checkout-overlay">
        <section className="order-success">
          <span className="success-icon">✓</span>
          <span className="eyebrow blue">ORDER CONFIRMED</span>
          <h2>Thank you, {form.name}!</h2>
          <p>
            Your Cash on Delivery order has been placed successfully. We will
            send updates to your mobile number.
          </p>

          <div className="success-order-id">
            Order ID: {placedOrder.orderNumber || placedOrder._id}
          </div>

          <button className="primary-button" onClick={closeCheckout}>
            Continue shopping
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-overlay">
      <section className="checkout-modal">
        <header className="checkout-header">
          <div>
            <span className="eyebrow blue">SECURE CHECKOUT</span>
            <h2>Complete your order</h2>
          </div>

          <button
            className="drawer-close"
            onClick={onClose}
            type="button"
            aria-label="Close checkout"
          >
            &times;
          </button>
        </header>

        <form className="checkout-content" onSubmit={placeOrder}>
          <div className="checkout-main">
            <section className="checkout-card">
              <h3>1. Delivery details</h3>

              <div className="form-grid">
                <label>
                  Full name
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Mobile number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateForm}
                    inputMode="numeric"
                    maxLength="10"
                    placeholder="10-digit mobile number"
                    required
                  />
                </label>
              </div>

              <label>
                Complete address
                <textarea
                  name="address"
                  value={form.address}
                  onChange={updateForm}
                  placeholder="House no., street, area and landmark"
                  rows="3"
                  required
                />
              </label>

              <div className="form-grid">
                <label>
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={updateForm}
                    placeholder="City"
                    required
                  />
                </label>

                <label>
                  Pincode
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={updateForm}
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="6-digit pincode"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="checkout-card">
              <h3>2. Delivery preference</h3>

              <label
                className={`choice-card ${
                  deliveryType === "local" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryType === "local"}
                  onChange={() => setDeliveryType("local")}
                />
                <span>
                  <b>Kanpur same-day delivery</b>
                  <small>Available for eligible Kanpur pincodes</small>
                </span>
                <strong>FREE</strong>
              </label>

              <label
                className={`choice-card ${
                  deliveryType === "courier" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryType === "courier"}
                  onChange={() => setDeliveryType("courier")}
                />
                <span>
                  <b>Courier delivery across India</b>
                  <small>Usually delivered within 3–7 business days</small>
                </span>
                <strong>FREE</strong>
              </label>
            </section>

            <section className="checkout-card">
              <h3>3. Payment method</h3>

              <label className="choice-card selected">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span>
                  <b>Cash on Delivery</b>
                  <small>Pay when your order arrives</small>
                </span>
                <strong>COD</strong>
              </label>

              <label className="choice-card">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                />
                <span>
                  <b>Pay online</b>
                  <small>UPI, debit/credit card and net banking — coming soon</small>
                </span>
                <strong>UPI</strong>
              </label>
            </section>
          </div>

          <aside className="checkout-summary">
            <h3>Order summary</h3>

            {cart.map((item) => (
              <div className="checkout-item" key={item._id || item.id}>
                <span>{item.name || item.title}</span>
                <b>
                  {item.quantity} × ₹{item.price}
                </b>
              </div>
            ))}

            <div className="checkout-total">
              <span>Total payable</span>
              <strong>₹{total}</strong>
            </div>

            <button
              className="primary-button checkout-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Placing order..." : "Place COD order"}
            </button>

            <small>
              By placing this order, you agree to DEALROOT’s return and privacy
              policies.
            </small>
          </aside>
        </form>
      </section>
    </div>
  );
}

export default CheckoutModal;