import { useState } from "react";
import {
  FaSearch,
  FaClipboardList,
  FaEnvelope,
  FaBoxOpen,
  FaCheckCircle,
  FaTruck,
  FaHome,
  FaTimesCircle,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./TrackOrder.css";

const statusSteps = ["placed", "confirmed", "packed", "shipped", "delivered"];

const statusLabels = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusIcons = {
  placed: <FaClipboardList />,
  confirmed: <FaCheckCircle />,
  packed: <FaBoxOpen />,
  shipped: <FaTruck />,
  delivered: <FaHome />,
};

function TrackTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div className="track-cancelled">
        <span>
          <FaTimesCircle />
        </span>
        <div>
          <b>This order was cancelled</b>
          <p>
            If you already paid, your refund will be processed within
            3–5 business days.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = statusSteps.indexOf(status);

  return (
    <div className="track-timeline">
      {statusSteps.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <div
            className={`track-step ${done ? "done" : ""}`}
            key={step}
          >
            <span className="track-step-icon">{statusIcons[step]}</span>
            <small>{statusLabels[step]}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrder({ apiUrl }) {
  const [form, setForm] = useState({ orderId: "", email: "" });
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const trackOrder = async (event) => {
    event.preventDefault();
    setError("");

    const orderId = form.orderId.trim();
    const email = form.email.trim();

    if (!orderId && !email) {
      setError("Please enter your order ID or email to track your order.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Could not track your order.");
        setOrders([]);
        setSearched(true);
        return;
      }

      setOrders(data.orders || []);
      setSearched(true);
    } catch {
      setError(
        "Could not connect to the server. Please try again later."
      );
      setOrders([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="track-page">
      {/* HERO */}
      <div className="track-hero">
        <span className="track-eyebrow">ORDER TRACKING</span>
        <h1>
          Track Your <span>Order</span>
        </h1>
        <p className="track-hero-sub">
          Enter your order ID or email address below to see the live
          status of your order.
        </p>

        <form className="track-search-form" onSubmit={trackOrder}>
          <div className="track-input-row">
            <label className="track-input">
              <FaClipboardList />
              <input
                name="orderId"
                value={form.orderId}
                onChange={updateForm}
                placeholder="Order ID (e.g. DR-1234567890-1234)"
                autoComplete="off"
              />
            </label>

            <span className="track-or">OR</span>

            <label className="track-input">
              <FaEnvelope />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                placeholder="Email address"
                autoComplete="email"
              />
            </label>
          </div>

          <button
            className="track-submit"
            type="submit"
            disabled={loading}
          >
            <FaSearch />
            {loading ? "Tracking..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="track-error" role="alert">
            <FaTimesCircle /> {error}
          </div>
        )}
      </div>

      <div className="track-body">
        {!searched && (
          <div className="track-empty">
            <FaTruck className="track-empty-icon" />
            <h2>Where's my order?</h2>
            <p>
              Type your order ID — you'll find it in your order
              confirmation email or receipt — or simply enter the email
              you used while placing the order. We'll show you every
              step from placed to delivered.
            </p>
          </div>
        )}

        {searched && !loading && orders.length === 0 && !error && (
          <div className="track-empty">
            <FaBoxOpen className="track-empty-icon" />
            <h2>No orders found</h2>
            <p>
              We couldn't find any order with those details. Please
              double-check your order ID or email and try again.
            </p>
          </div>
        )}

        {orders.map((order) => (
          <article className="track-order-card" key={order._id}>
            <header className="track-order-head">
              <div>
                <span className="track-order-label">ORDER</span>
                <b>{order.orderNumber}</b>
                <small>
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </small>
              </div>

              <div className="track-order-status">
                <span className={`track-status-pill status-${order.orderStatus}`}>
                  {statusLabels[order.orderStatus] || order.orderStatus}
                </span>
                <small>
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </small>
              </div>
            </header>

            <TrackTimeline status={order.orderStatus} />

            <div className="track-items">
              {order.items?.map((item) => (
                <div className="track-item" key={item.product || item.title}>
                  <img
                    src={item.images?.[0] || "https://placehold.co/60x60?text=Product"}
                    alt={item.title || "Product"}
                  />
                  <div className="track-item-info">
                    <b>{item.title}</b>
                    <small>{item.brand}</small>
                  </div>
                  <div className="track-item-meta">
                    <span>
                      {item.quantity} × ₹{item.price}
                    </span>
                    <b>₹{item.subtotal}</b>
                  </div>
                </div>
              ))}
            </div>

            <footer className="track-order-foot">
              <div>
                <FaMapMarkerAlt />
                <span>
                  {order.customer?.name} • {order.customer?.city},{" "}
                  {order.customer?.state} - {order.customer?.pincode}
                </span>
              </div>
              <div className="track-total">
                <small>Total</small>
                <b>₹{order.totalAmount}</b>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
