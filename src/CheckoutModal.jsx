import { useState } from "react";

function CheckoutModal({ isOpen, onClose, cart, total, showToast }) {
  const [deliveryType, setDeliveryType] = useState("courier");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "Kanpur",
    pincode: "",
  });

  if (!isOpen) return null;

  const updateForm = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const placeOrder = (event) => {
    event.preventDefault();

    if (!form.name || !form.phone || !form.address || !form.pincode) {
      showToast("Please complete your delivery details");
      return;
    }

    setPlaced(true);
  };

  const closeCheckout = () => {
    setPlaced(false);
    onClose();
  };

  if (placed) {
    return (
      <div className="checkout-overlay">
        <section className="order-success">
          <span className="success-icon">OK</span>
          <span className="eyebrow blue">ORDER CONFIRMED</span>
          <h2>Thank you, {form.name}!</h2>
          <p>
            Your order has been placed successfully. We will send updates to
            your mobile number.
          </p>
          <div className="success-order-id">Order ID: DRB-2026-1048</div>
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
          <button className="drawer-close" onClick={onClose}>
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

              <label
                className={`choice-card ${
                  paymentMethod === "cod" ? "selected" : ""
                }`}
              >
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

              <label
                className={`choice-card ${
                  paymentMethod === "online" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                />
                <span>
                  <b>Pay online</b>
                  <small>UPI, debit/credit card and net banking</small>
                </span>
                <strong>UPI</strong>
              </label>
            </section>
          </div>

          <aside className="checkout-summary">
            <h3>Order summary</h3>

            {cart.map((item) => (
              <div className="checkout-item" key={item.id}>
                <span>{item.name}</span>
                <b>
                  {item.quantity} x ₹{item.price}
                </b>
              </div>
            ))}

            <div className="checkout-total">
              <span>Total payable</span>
              <strong>₹{total}</strong>
            </div>

            <button className="primary-button checkout-submit" type="submit">
              {paymentMethod === "cod"
                ? "Place COD order"
                : "Continue to secure payment"}
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