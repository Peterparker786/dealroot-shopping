import { useEffect, useState } from "react";
import "./CouponCheckout.css";

const emptyDeliveryForm = {
  name: "",
  phone: "",
  address: "",
  city: "Kanpur",
  pincode: "",
};

let razorpayScriptPromise = null;

const loadRazorpayCheckout = () => {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    const handleLoad = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        razorpayScriptPromise = null;
        reject(new Error("Razorpay Checkout could not be loaded"));
      }
    };

    const handleError = () => {
      razorpayScriptPromise = null;
      reject(new Error("Could not load secure payment. Please try again."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

function CheckoutModal({
  isOpen,
  onClose,
  cart = [],
  showToast,
  onOrderPlaced,
  apiUrl,
  user,
  userToken,
  onProfileUpdated,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyDeliveryForm);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState({
    type: "",
    text: "",
  });
  const userKey = user?.id || user?._id || user?.email || "";

  useEffect(() => {
    if (!isOpen) return;

    setPaymentMethod("cod");
    setIsSubmitting(false);
    setCouponInput("");
    setAppliedCoupon("");
    setCouponMessage({ type: "", text: "" });

    if (!user) {
      setForm({ ...emptyDeliveryForm });
      setPlacedOrder(null);
      return;
    }

    setForm({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "Kanpur",
      pincode: user.pincode || "",
    });
    setPlacedOrder(null);
  }, [isOpen, userKey]);

  if (!isOpen) return null;

  const orderSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const normalizedCity = form.city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const isKanpurAddress = normalizedCity.includes("kanpur");
  const deliveryType = isKanpurAddress ? "local" : "courier";
  const hasFreeDelivery =
    orderSubtotal === 0 || orderSubtotal >= 499;
  const deliveryFee =
    hasFreeDelivery
      ? 0
      : isKanpurAddress
      ? 29
      : 49;
  const deliveryLabel = deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`;
  const kanpurDeliveryLabel = hasFreeDelivery ? "FREE" : "₹29";
  const indiaDeliveryLabel = hasFreeDelivery ? "FREE" : "₹49";
  const couponDiscount =
    appliedCoupon === "WELCOME10" && orderSubtotal > 499
      ? Math.round(orderSubtotal * 0.1)
      : 0;
  const totalPayable = orderSubtotal - couponDiscount + deliveryFee;

  const applyCoupon = () => {
    const normalizedCoupon = couponInput.trim().toUpperCase();

    if (!normalizedCoupon) {
      setAppliedCoupon("");
      setCouponMessage({
        type: "error",
        text: "Please enter a coupon code.",
      });
      return;
    }

    if (normalizedCoupon !== "WELCOME10") {
      setAppliedCoupon("");
      setCouponMessage({
        type: "error",
        text: "Invalid coupon code.",
      });
      return;
    }

    if (orderSubtotal <= 499) {
      setAppliedCoupon("");
      setCouponMessage({
        type: "error",
        text: "WELCOME10 applies only when the cart subtotal is above ₹499.",
      });
      return;
    }

    setCouponInput("WELCOME10");
    setAppliedCoupon("WELCOME10");
    setCouponMessage({
      type: "success",
      text: `Coupon applied! You saved ₹${Math.round(orderSubtotal * 0.1)}.`,
    });
  };

  const removeCoupon = () => {
    setCouponInput("");
    setAppliedCoupon("");
    setCouponMessage({ type: "", text: "" });
  };

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const selectDeliveryArea = (area) => {
    setForm((current) => {
      if (area === "kanpur") {
        return {
          ...current,
          city: "Kanpur",
        };
      }

      const currentCity = String(current.city || "")
        .trim()
        .toLowerCase();

      return {
        ...current,
        city: currentCity.includes("kanpur") ? "" : current.city,
      };
    });
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    const phone = form.phone.replace(/\D/g, "");
    const pincode = form.pincode.replace(/\D/g, "");

    if (
      !form.name.trim() ||
      !phone ||
      !form.address.trim() ||
      !form.city.trim() ||
      !pincode
    ) {
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

    const orderPayload = {
      customer: {
        name: form.name.trim(),
        phone,
        address: form.address.trim(),
        city: form.city.trim(),
        pincode,
      },
      items: cart.map((item) => ({
        productId: item._id || item.id,
        quantity: item.quantity,
      })),
      deliveryType,
      couponCode: appliedCoupon,
    };

    const requestHeaders = {
      "Content-Type": "application/json",
      ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    };

    const completeOrder = (order) => {
      setPlacedOrder(order);

      if (user) {
        onProfileUpdated?.({
          ...user,
          name: form.name.trim(),
          phone,
          address: form.address.trim(),
          city: form.city.trim(),
          pincode,
        });
      }

      onOrderPlaced?.(order);
    };

    if (paymentMethod === "cod") {
      try {
        setIsSubmitting(true);

        const response = await fetch(`${apiUrl}/api/orders`, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify({
            ...orderPayload,
            paymentMethod: "cod",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not place your order");
        }

        completeOrder(data.order);
      } catch (error) {
        showToast?.(
          error.message || "Could not place your order. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    try {
      setIsSubmitting(true);
      await loadRazorpayCheckout();

      const createResponse = await fetch(
        `${apiUrl}/api/payments/razorpay/create-order`,
        {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(orderPayload),
        }
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(
          createData.message || "Could not start secure payment"
        );
      }

      let paymentHandled = false;

      const razorpayCheckout = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        name: "DEALROOT",
        description: `Payment for ${createData.orderNumber}`,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: form.name.trim(),
          email: user?.email || "",
          contact: `+91${phone}`,
        },
        notes: {
          dealroot_order_number: createData.orderNumber,
        },
        theme: {
          color: "#2563eb",
        },
        retry: {
          enabled: true,
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (!paymentHandled) {
              setIsSubmitting(false);
              showToast?.("Payment cancelled. Your cart is still saved.");
            }
          },
        },
        handler: async (paymentResult) => {
          paymentHandled = true;

          try {
            const verifyResponse = await fetch(
              `${apiUrl}/api/payments/razorpay/verify`,
              {
                method: "POST",
                headers: requestHeaders,
                body: JSON.stringify({
                  paymentSessionId: createData.paymentSessionId,
                  razorpayOrderId: paymentResult.razorpay_order_id,
                  razorpayPaymentId: paymentResult.razorpay_payment_id,
                  razorpaySignature: paymentResult.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment received, but verification is pending"
              );
            }

            completeOrder(verifyData.order);
            showToast?.("Payment successful. Your order is confirmed.");
          } catch (error) {
            showToast?.(
              error.message ||
                "Payment received. Please check My Orders before trying again."
            );
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      razorpayCheckout.on("payment.failed", (failure) => {
        showToast?.(
          failure?.error?.description ||
            "Payment failed. You can retry or choose Cash on Delivery."
        );
      });

      razorpayCheckout.open();
    } catch (error) {
      setIsSubmitting(false);
      showToast?.(
        error.message || "Could not start secure payment. Please try again."
      );
    }
  };

  const closeCheckout = () => {
    setPlacedOrder(null);
    onClose();
  };

  if (placedOrder) {
    const isOnlineOrder = placedOrder.paymentMethod === "razorpay";

    return (
      <div className="checkout-overlay">
        <section className="order-success">
          <span className="success-icon">✓</span>
          <span className="eyebrow blue">
            {isOnlineOrder ? "PAYMENT SUCCESSFUL" : "ORDER CONFIRMED"}
          </span>
          <h2>Thank you, {form.name}!</h2>
          <p>
            {isOnlineOrder
              ? "Your online payment is verified and your order is confirmed."
              : "Your Cash on Delivery order has been placed successfully."}{" "}
            We will send updates to your mobile number.
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

              {user && (
                <p className="checkout-account-note">
                  Signed in as <b>{user.email}</b>. Your latest delivery details
                  will be saved to your account.
                </p>
              )}

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
                    placeholder="Enter delivery city"
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
              <h3>2. Delivery method</h3>

              <label
                className={`choice-card ${
                  isKanpurAddress ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={isKanpurAddress}
                  onChange={() => selectDeliveryArea("kanpur")}
                />
                <span>
                  <b>Kanpur local delivery</b>
                  <small>
                    {hasFreeDelivery
                      ? "Free delivery on this order"
                      : "Delivery charge ₹29 for Kanpur addresses"}
                  </small>
                </span>
                <strong>{kanpurDeliveryLabel}</strong>
              </label>

              <label
                className={`choice-card ${
                  !isKanpurAddress ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={!isKanpurAddress}
                  onChange={() => selectDeliveryArea("india")}
                />
                <span>
                  <b>Other city in India</b>
                  <small>
                    {hasFreeDelivery
                      ? "Free delivery on this order"
                      : "Delivery charge ₹49 outside Kanpur"}
                  </small>
                </span>
                <strong>{indiaDeliveryLabel}</strong>
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
                <strong>SECURE</strong>
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

            <div className="checkout-item">
              <span>
                Delivery charge {isKanpurAddress ? "(Kanpur)" : "(India)"}
              </span>
              <b>{deliveryLabel}</b>
            </div>

            <div className="checkout-coupon">
              <label htmlFor="checkout-coupon-code">Have a coupon?</label>

              <div className="checkout-coupon-row">
                <input
                  id="checkout-coupon-code"
                  type="text"
                  value={couponInput}
                  onChange={(event) => {
                    setCouponInput(event.target.value.toUpperCase());

                    if (appliedCoupon) {
                      setAppliedCoupon("");
                      setCouponMessage({ type: "", text: "" });
                    }
                  }}
                  placeholder="Enter coupon code"
                  autoComplete="off"
                  disabled={isSubmitting}
                />

                {appliedCoupon ? (
                  <button
                    type="button"
                    className="coupon-remove-button"
                    onClick={removeCoupon}
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className="coupon-apply-button"
                    onClick={applyCoupon}
                    disabled={isSubmitting}
                  >
                    Apply
                  </button>
                )}
              </div>

              <small className="coupon-help">
                WELCOME10 gives 10% off when the cart subtotal is above ₹499.
              </small>

              {couponMessage.text && (
                <p
                  className={`coupon-message ${couponMessage.type}`}
                  role="status"
                >
                  {couponMessage.text}
                </p>
              )}
            </div>

            {couponDiscount > 0 && (
              <div className="checkout-item coupon-discount-row">
                <span>WELCOME10 discount</span>
                <b>−₹{couponDiscount}</b>
              </div>
            )}

            <div className="checkout-total">
              <span>Total payable</span>
              <strong>₹{totalPayable}</strong>
            </div>

            <button
              className="primary-button checkout-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? paymentMethod === "online"
                  ? "Opening secure payment..."
                  : "Placing order..."
                : paymentMethod === "online"
                ? `Pay ₹${totalPayable} securely`
                : "Place COD order"}
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
