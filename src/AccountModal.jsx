import { useEffect, useState } from "react";
import "./AccountModal.css";

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
};

const emptyProfile = {
  name: "",
  phone: "",
  address: "",
  city: "Kanpur",
  pincode: "",
};

export default function AccountModal({
  isOpen,
  onClose,
  apiUrl,
  user,
  token,
  onAuth,
  onLogout,
  onUserUpdated,
  showToast,
}) {
  const [mode, setMode] = useState("login");
  const [tab, setTab] = useState("profile");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(emptyProfile);
      return;
    }

    setProfile({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "Kanpur",
      pincode: user.pincode || "",
    });
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setAuthError("");
      setSaveSuccess(false);
      return undefined;
    }

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !user || !token || tab !== "orders") {
      return undefined;
    }

    let requestCancelled = false;

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);

        const response = await fetch(`${apiUrl}/api/auth/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load orders");
        }

        if (!requestCancelled) {
          setOrders(data.orders || []);
        }
      } catch (error) {
        if (!requestCancelled) {
          showToast?.(error.message);
        }
      } finally {
        if (!requestCancelled) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, isOpen, showToast, tab, token, user]);

  if (!isOpen) {
    return null;
  }

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setAuthForm(emptyAuthForm);
    setAuthError("");
  };

  const updateAuthForm = (event) => {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (authError) {
      setAuthError("");
    }
  };

  const updateProfile = (event) => {
    const { name, value } = event.target;
    let cleanValue = value;

    if (name === "phone") {
      cleanValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "pincode") {
      cleanValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setProfile((current) => ({
      ...current,
      [name]: cleanValue,
    }));
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      setSubmitting(true);

      const payload =
        mode === "signup"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const response = await fetch(`${apiUrl}/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        let errorMessage =
          data.message ||
          (mode === "login"
            ? "Could not log in. Please try again."
            : "Could not create your account.");

        if (mode === "login" && response.status === 401) {
          errorMessage = "Incorrect email or password.";
        }

        throw new Error(errorMessage);
      }

onAuth(data.token, data.user);
setAuthForm(emptyAuthForm);
setAuthError?.("");

if (mode === "login") {
  showToast?.("Login successful");

  setTimeout(() => {
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 800);
} else {
  setTab("profile");
  showToast?.("Account created successfully");
}
    } catch (error) {
      const errorMessage =
        error instanceof TypeError
          ? "Could not connect to the server. Please try again."
          : error.message || "Could not continue. Please try again.";

      setAuthError(errorMessage);
      showToast?.(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setSaveSuccess(false);

      const response = await fetch(`${apiUrl}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save profile");
      }

      onUserUpdated(data.user);
      setSaveSuccess(true);
      showToast?.("Address saved successfully");

      window.setTimeout(() => {
        onClose();
        window.location.assign("/");
      }, 1800);
    } catch (error) {
      setSaveSuccess(false);
      showToast?.(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    setTab("profile");
    setOrders([]);
    setAuthForm(emptyAuthForm);
    setAuthError("");
    showToast?.("Logged out successfully");
  };

  const statusLabel = (status = "placed") =>
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div
      className="account-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-label="DEALROOT account"
      >
        <header className="account-header">
          <div>
            <span className="eyebrow blue">DEALROOT ACCOUNT</span>
            <h2>
              {user
                ? `Hello, ${user.name?.split(" ")[0] || "Customer"}`
                : "Welcome to DEALROOT"}
            </h2>
          </div>

          <button
            className="drawer-close"
            type="button"
            onClick={onClose}
            aria-label="Close account"
          >
            &times;
          </button>
        </header>

        {!user ? (
          <div className="account-auth-wrap">
            <div className="account-auth-copy">
              <span className="account-avatar">D</span>
              <h3>Shopping gets easier with an account.</h3>
              <p>
                Save your address, check every order, and enjoy a
                faster checkout.
              </p>

              <ul>
                <li>✓ Saved delivery details</li>
                <li>✓ Personal order history</li>
                <li>✓ Secure 7-day login session</li>
              </ul>
            </div>

            <form className="account-auth-form" onSubmit={submitAuth}>
              <div className="auth-switch">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => changeMode("login")}
                >
                  Log in
                </button>

                <button
                  type="button"
                  className={mode === "signup" ? "active" : ""}
                  onClick={() => changeMode("signup")}
                >
                  Sign up
                </button>
              </div>

              {mode === "signup" && (
                <label>
                  Full name

                  <input
                    name="name"
                    type="text"
                    value={authForm.name}
                    onChange={updateAuthForm}
                    required
                    minLength="2"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </label>
              )}

              <label>
                Email address

                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={updateAuthForm}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label>
                Password

                <input
                  name="password"
                  type="password"
                  minLength="8"
                  value={authForm.password}
                  onChange={updateAuthForm}
                  required
                  placeholder="Minimum 8 characters"
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  aria-describedby={authError ? "account-auth-error" : undefined}
                />
              </label>

              {authError && (
                <div
                  id="account-auth-error"
                  role="alert"
                  style={{
                    padding: "12px 14px",
                    border: "1px solid #fda29b",
                    borderRadius: "10px",
                    background: "#fef3f2",
                    color: "#b42318",
                    fontSize: "14px",
                    fontWeight: 700,
                    lineHeight: 1.45,
                  }}
                >
                  {authError}
                </div>
              )}

              <button
                className="primary-button account-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Please wait..."
                  : mode === "login"
                  ? "Log in"
                  : "Create account"}
              </button>
            </form>
          </div>
        ) : (
          <div className="account-dashboard">
            <aside className="account-menu">
              <div className="account-user-card">
                <span>
                  {user.name?.charAt(0).toUpperCase() || "D"}
                </span>

                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
              </div>

              <button
                type="button"
                className={tab === "profile" ? "active" : ""}
                onClick={() => setTab("profile")}
              >
                Profile & address
              </button>

              <button
                type="button"
                className={tab === "orders" ? "active" : ""}
                onClick={() => setTab("orders")}
              >
                My orders
              </button>

              <button
                className="account-logout"
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </aside>

            <div className="account-panel">
              {tab === "profile" ? (
                <form className="profile-form" onSubmit={saveProfile}>
                  <div className="full-field">
                    <span className="eyebrow blue">MY DETAILS</span>
                    <h3>Profile & delivery address</h3>
                    <p>
                      These details will automatically appear during
                      checkout.
                    </p>
                  </div>

                  <label>
                    Full name

                    <input
                      name="name"
                      type="text"
                      value={profile.name}
                      onChange={updateProfile}
                      required
                    />
                  </label>

                  <label>
                    Email address

                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                    />
                  </label>

                  <label>
                    Mobile number

                    <input
                      name="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={updateProfile}
                      inputMode="numeric"
                      maxLength="10"
                      placeholder="10-digit mobile number"
                    />
                  </label>

                  <label className="full-field">
                    Complete address

                    <textarea
                      name="address"
                      value={profile.address}
                      onChange={updateProfile}
                      rows="3"
                      placeholder="House no., street, area and landmark"
                    />
                  </label>

                  <label>
                    City

                    <input
                      name="city"
                      type="text"
                      value={profile.city}
                      onChange={updateProfile}
                    />
                  </label>

                  <label>
                    Pincode

                    <input
                      name="pincode"
                      type="text"
                      value={profile.pincode}
                      onChange={updateProfile}
                      inputMode="numeric"
                      maxLength="6"
                      placeholder="6-digit pincode"
                    />
                  </label>

                  {saveSuccess && (
                    <div
                      className="full-field"
                      role="status"
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #a6f4c5",
                        borderRadius: "10px",
                        background: "#ecfdf3",
                        color: "#067647",
                        fontWeight: 700,
                      }}
                    >
                      ✓ Address saved successfully
                    </div>
                  )}

                  <button
                    className="primary-button profile-save"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save details"}
                  </button>
                </form>
              ) : (
                <section className="orders-panel">
                  <div>
                    <span className="eyebrow blue">
                      ORDER HISTORY
                    </span>
                    <h3>My orders</h3>
                    <p>
                      Orders placed while logged in will appear here.
                    </p>
                  </div>

                  {loadingOrders ? (
                    <div className="account-empty">
                      Loading your orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="account-empty">
                      You have not placed an order from this account yet.
                    </div>
                  ) : (
                    <div className="order-history-list">
                      {orders.map((order) => (
                        <article
                          className="history-order"
                          key={order._id}
                        >
                          <header>
                            <div>
                              <b>{order.orderNumber}</b>
                              <small>
                                {new Date(
                                  order.createdAt
                                ).toLocaleString("en-IN")}
                              </small>
                            </div>

                            <span
                              className={`order-status status-${order.orderStatus}`}
                            >
                              {statusLabel(order.orderStatus)}
                            </span>
                          </header>

                          <div className="history-items">
                            {order.items?.map((item) => (
                              <div key={item._id || item.product}>
                                <img
                                  src={
                                    item.image ||
                                    "https://placehold.co/60x60?text=Product"
                                  }
                                  alt={item.title || "Product"}
                                />

                                <span>
                                  {item.title}
                                  <small>
                                    {item.quantity} × ₹{item.price}
                                  </small>
                                </span>
                              </div>
                            ))}
                          </div>

                          <footer>
                            <span>Cash on Delivery</span>
                            <b>Total ₹{order.totalAmount}</b>
                          </footer>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
