import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { State, City } from "country-state-city";
import "./CouponCheckout.css";

const emptyDeliveryForm = {
  name: "",
  phone: "",
  state: "Uttar Pradesh",
  city: "Kanpur",
  address: "",
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
  const [selectedState, setSelectedState] = useState(null);
const [selectedCity, setSelectedCity] = useState(null);
  const [form, setForm] = useState(emptyDeliveryForm);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState({
    type: "",
    text: "",
  });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availableCoupons] = useState([]);
  const userKey = user?.id || user?._id || user?.email || "";

const stateOptions = useMemo(() => {
  return State.getStatesOfCountry("IN").map((state) => ({
    value: state.isoCode,
    label: state.name,
  }));
}, []);

const cityOptions = useMemo(() => {
  if (!selectedState) return [];

  return City.getCitiesOfState("IN", selectedState.value).map((city) => ({
    value: city.name,
    label: city.name,
  }));
}, [selectedState]);

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
  state: user.state || "Uttar Pradesh",
  address: user.address || "",
  city: user.city || "Kanpur",
  pincode: user.pincode || "",
});
    setPlacedOrder(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userKey]);
useEffect(() => {
  if (!form.state) return;

  const state = State.getStatesOfCountry("IN").find(
    (s) => s.name === form.state
  );

  if (state) {
    setSelectedState({
      value: state.isoCode,
      label: state.name,
    });

    const city = City.getCitiesOfState("IN", state.isoCode).find(
      (c) => c.name === form.city
    );

    if (city) {
      setSelectedCity({
        value: city.name,
        label: city.name,
      });
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

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
const couponDiscount = discountAmount;
  const totalPayable = orderSubtotal - couponDiscount + deliveryFee;
  const payableNow =
  paymentMethod === "cod"
    ? deliveryFee
    : totalPayable;

const remainingCod =
  paymentMethod === "cod"
    ? totalPayable - deliveryFee
    : 0;

  const applyCoupon = async () => {
  const code = couponInput.trim().toUpperCase();

  if (!code) {
    setAppliedCoupon("");
    setDiscountAmount(0);

    setCouponMessage({
      type: "error",
      text: "Please enter a coupon code.",
    });

    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/coupons/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        subtotal: orderSubtotal,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    setAppliedCoupon(code);
    setDiscountAmount(data.discount);

    setCouponMessage({
      type: "success",
      text: `Coupon applied! You saved ₹${data.discount}`,
    });

  } catch (err) {
    setAppliedCoupon("");
    setDiscountAmount(0);

    setCouponMessage({
      type: "error",
      text: err.message,
    });
  }
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
if (!user || !userToken) {
  showToast?.("Please login to place your order.");
  return;
}
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
    state: form.state,
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
  paymentMethod:
    paymentMethod === "online"
      ? "razorpay"
      : "cod",
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
  state: form.state,
  address: form.address.trim(),
          city: form.city.trim(),
          pincode,
        });
      }

      onOrderPlaced?.(order);
    };

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

      console.log({
  key: createData.keyId,
  amount: createData.amount,
  currency: createData.currency,
  order_id: createData.razorpayOrderId,
  session: createData.paymentSessionId,
  createData,
});

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
  State

  <Select
    options={stateOptions}
    value={selectedState}
    placeholder="Search State..."
    isSearchable
    onChange={(state) => {
      setSelectedState(state);
      setSelectedCity(null);

      setForm((current) => ({
        ...current,
        state: state.label,
        city: "",
      }));
    }}
  />
</label>
<label>
  City

  <Select
    options={cityOptions}
    value={selectedCity}
    placeholder="Search City..."
    isSearchable
    isDisabled={!selectedState}
    onChange={(city) => {
      setSelectedCity(city);

      setForm((current) => ({
        ...current,
        city: city.label,
      }));
    }}
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

{availableCoupons.length > 0 && (
  <div className="available-coupons">
    <h4>🏷 Available Offers</h4>

    {[...availableCoupons]
  .sort((a, b) => {
    const aValue =
      a.discountType === "percentage"
        ? a.discountValue * orderSubtotal
        : a.discountValue;

    const bValue =
      b.discountType === "percentage"
        ? b.discountValue * orderSubtotal
        : b.discountValue;

    return bValue - aValue;
  })
  .map((coupon, index) => {
      const eligible = orderSubtotal >= coupon.minimumOrder;

      return (
        <div className="coupon-card" key={coupon._id}>
          <div className="coupon-details">

  {index === 0 && (
    <span className="best-offer-badge">
      ⭐ Best Offer
    </span>
  )}

  <div className="coupon-code">
    {coupon.code}
  </div>

            <div className="coupon-discount">
              {coupon.discountType === "percentage"
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue} OFF`}
            </div>

            <small>
              Min Order ₹{coupon.minimumOrder}
            </small>

            {coupon.maximumDiscount > 0 && (
              <small>
                Max Discount ₹{coupon.maximumDiscount}
              </small>
            )}
          </div>

          {appliedCoupon === coupon.code ? (
            <button className="coupon-applied" disabled>
              ✓ Applied
            </button>
          ) : (
            <button
              className="coupon-apply"
              disabled={!eligible}
              onClick={() => {
                setCouponInput(coupon.code);
                setTimeout(() => applyCoupon(), 100);
              }}
            >
              {eligible ? "Apply" : "Not Eligible"}
            </button>
          )}
        </div>
      );
    })}
  </div>
)}

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
                WELCOME50 gives 50% off when the cart subtotal is above ₹200.
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
                <span>{appliedCoupon} Discount</span>
                <b>−₹{couponDiscount}</b>
              </div>
            )}

           <div className="checkout-total">
  <span>Total Order</span>
  <strong>₹{totalPayable}</strong>
</div>

{paymentMethod === "cod" && (
  <>
    <div className="checkout-item">
      <span>Pay Now (Delivery Charge)</span>
      <b>₹{payableNow}</b>
    </div>

    <div className="checkout-item">
      <span>Remaining COD</span>
      <b>₹{remainingCod}</b>
    </div>
  </>
)}

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
                : `Pay ₹${payableNow} & Confirm COD`}
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
