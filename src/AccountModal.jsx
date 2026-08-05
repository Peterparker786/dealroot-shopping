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

function MascotArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="maBody"
          x1="90"
          y1="30"
          x2="150"
          y2="186"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eaf1ff" />
          <stop offset="1" stopColor="#cfe3ff" />
        </linearGradient>
        <linearGradient
          id="maCape"
          x1="62"
          y1="92"
          x2="158"
          y2="186"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient
          id="maWand"
          x1="150"
          y1="60"
          x2="196"
          y2="106"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffe4f1" />
        </linearGradient>
      </defs>

      <g className="ma-sparkles" opacity="0.95">
        <path
          d="M34 54 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z"
          fill="#ffffff"
          opacity="0.95"
        />
        <path
          d="M188 152 l3.5 7.5 7.5 3.5 -7.5 3.5 -3.5 7.5 -3.5 -7.5 -7.5 -3.5 7.5 -3.5 z"
          fill="#ffffff"
          opacity="0.8"
        />
        <circle cx="48" cy="152" r="3" fill="#ffffff" opacity="0.75" />
        <circle cx="176" cy="54" r="2.6" fill="#ffffff" opacity="0.85" />
      </g>

      <path
        d="M110 92 C 74 108 60 140 62 172 C 96 188 128 190 158 176 C 156 142 140 108 110 92 Z"
        fill="url(#maCape)"
        opacity="0.92"
      />

      <path
        d="M110 30 C 62 30 40 74 40 118 C 40 164 72 186 110 186 C 148 186 180 164 180 118 C 180 74 158 30 110 30 Z"
        fill="url(#maBody)"
        stroke="#ffffff"
        strokeWidth="4"
      />

      <ellipse cx="76" cy="128" rx="11" ry="7" fill="#fda4c4" opacity="0.85" />
      <ellipse cx="144" cy="128" rx="11" ry="7" fill="#fda4c4" opacity="0.85" />

      <ellipse cx="88" cy="106" rx="8.5" ry="10" fill="#17324f" />
      <ellipse cx="132" cy="106" rx="8.5" ry="10" fill="#17324f" />
      <circle cx="91" cy="101" r="3.2" fill="#ffffff" />
      <circle cx="135" cy="101" r="3.2" fill="#ffffff" />

      <path
        d="M100 132 Q110 144 120 132"
        stroke="#17324f"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      <g>
        <circle cx="95" cy="42" r="9" fill="#f9a8d4" />
        <circle cx="110" cy="34" r="9" fill="#c4b5fd" />
        <circle cx="126" cy="43" r="9" fill="#fcd34d" />
        <circle cx="95" cy="42" r="3.4" fill="#ffffff" opacity="0.8" />
        <circle cx="110" cy="34" r="3.4" fill="#ffffff" opacity="0.8" />
        <circle cx="126" cy="43" r="3.4" fill="#ffffff" opacity="0.8" />
      </g>

      <line
        x1="160"
        y1="80"
        x2="182"
        y2="58"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="160"
        y1="80"
        x2="182"
        y2="58"
        stroke="#d8b4fe"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M196 34 l5.5 12 12 5.5 -12 5.5 -5.5 12 -5.5 -12 -12 -5.5 12 -5.5 z"
        fill="url(#maWand)"
        stroke="#ffffff"
        strokeWidth="2"
      />

      <ellipse cx="110" cy="199" rx="58" ry="9" fill="rgba(10,30,70,0.22)" />
    </svg>
  );
}

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
  const [forgotMode, setForgotMode] = useState(false);
  const [otpData, setOtpData] = useState({
    email: "",
    otp: "",
    password: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [resendIn, setResendIn] = useState(0);

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
      setResendIn(0);
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

  // 30s countdown before the user can request another OTP.
  useEffect(() => {
    if (resendIn <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendIn]);

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

  const updateOtpForm = (event) => {
    const { name, value } = event.target;

    setOtpData((current) => ({
      ...current,
      [name]: value,
    }));
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

  const sendOTP = async () => {
    try {
      setSubmitting(true);
      setEmailNotFound(false);
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data.message || "").toLowerCase();
        // Detect "user not found" / "email not registered" type responses
        if (msg.includes("not found") || msg.includes("not registered") || msg.includes("doesn't exist")) {
          setEmailNotFound(true);
          return;
        }
        throw new Error(data.message || "Failed to send OTP");
      }

      showToast?.("OTP sent successfully");
      setOtpSent(true);
      setResendIn(30);
    } catch (err) {
      showToast?.(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      setSubmitting(true);

      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpData.email,
          otp: otpData.otp,
          password: otpData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Could not reset password");

      showToast?.("Password reset successfully");
      setForgotMode(false);
      setOtpSent(false);
      setOtpData({ email: "", otp: "", password: "" });
      setResendIn(0);
    } catch (err) {
      setAuthError(err.message);
      showToast?.(err.message);
    } finally {
      setSubmitting(false);
    }
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

  const handleCopyTilt = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tilt-x", px.toFixed(3));
    el.style.setProperty("--tilt-y", py.toFixed(3));
  };

  const handleCopyTiltReset = (event) => {
    event.currentTarget.style.setProperty("--tilt-x", "0");
    event.currentTarget.style.setProperty("--tilt-y", "0");
  };

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
            <div
              className="account-auth-copy"
              onMouseMove={handleCopyTilt}
              onMouseLeave={handleCopyTiltReset}
            >
              <span className="auth-orb orb-a" aria-hidden="true" />
              <span className="auth-orb orb-b" aria-hidden="true" />
              <span className="auth-orb orb-c" aria-hidden="true" />

              <div className="auth-copy-layer">
                <span className="account-avatar">DEALROOT</span>
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

              <div className="auth-mascot-wrap" aria-hidden="true">
                <span className="auth-float-chip chip-1">💄</span>
                <span className="auth-float-chip chip-2">✨</span>
                <MascotArt className="account-mascot" />
                <span className="mascot-shadow" />
              </div>
            </div>

            {!forgotMode ? (
              <form className="account-auth-form" onSubmit={submitAuth}>
                <div className="auth-mobile-mascot" aria-hidden="true">
                  <MascotArt className="auth-mobile-mascot-art" />
                </div>

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

                {mode === "login" && (
                  <div
                    style={{
                      textAlign: "right",
                      marginTop: "-8px",
                      marginBottom: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#246bfd",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

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
            ) : (
              <form className="account-auth-form" onSubmit={(e) => { e.preventDefault(); if (otpSent) { resetPassword(e); } else { sendOTP(); } }}>
                <div className="auth-mobile-mascot" aria-hidden="true">
                  <MascotArt className="auth-mobile-mascot-art" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setOtpSent(false);
                    setEmailNotFound(false);
                    setOtpData({ email: "", otp: "", password: "" });
                    setAuthError("");
                    setResendIn(0);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#246bfd",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                    textAlign: "left",
                    padding: 0,
                    marginBottom: "8px",
                  }}
                >
                  &larr; Back to login
                </button>

                <h3 style={{ margin: 0, fontSize: "21px", color: "#193651" }}>
                  Reset your password
                </h3>
                <p style={{ margin: "4px 0 16px", color: "#77899b", fontSize: "13px" }}>
                  {otpSent
                    ? "Enter the OTP sent to your email and set a new password."
                    : "Enter your email to receive a one-time password."}
                </p>

                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    value={otpData.email}
                    onChange={updateOtpForm}
                    required
                    disabled={otpSent}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>                    {otpSent && (
                  <>
                    <label>
                      OTP
                      <input
                        name="otp"
                        type="text"
                        value={otpData.otp}
                        onChange={updateOtpForm}
                        required
                        placeholder="6-digit OTP"
                        autoComplete="one-time-code"
                      />
                    </label>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "-6px",
                        marginBottom: "14px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={resendIn > 0 || submitting}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: resendIn > 0 || submitting ? "default" : "pointer",
                          color: resendIn > 0 ? "#98a6b4" : "#246bfd",
                          fontWeight: 600,
                          fontSize: "13px",
                          opacity: submitting ? 0.6 : 1,
                        }}
                      >
                        {resendIn > 0
                          ? `Resend OTP in ${resendIn}s`
                          : submitting
                          ? "Sending..."
                          : "Resend OTP"}
                      </button>
                    </div>

                    <label>
                      New password
                      <input
                        name="password"
                        type="password"
                        minLength="8"
                        value={otpData.password}
                        onChange={updateOtpForm}
                        required
                        placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    aria-describedby={authError ? "account-auth-error" : undefined}
                  />
                    </label>
                  </>
                )}

                {emailNotFound && (
                  <div
                    role="alert"
                    style={{
                      padding: "14px 16px",
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    No account found with <strong>{otpData.email}</strong>.
                    <br />
                    Please{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(false);
                        setOtpSent(false);
                        setEmailNotFound(false);
                        setOtpData({ email: "", otp: "", password: "" });
                        setAuthError("");
                        setResendIn(0);
                        changeMode("signup");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 700,
                        textDecoration: "underline",
                        padding: 0,
                        fontSize: "inherit",
                      }}
                    >
                      create an account
                    </button>
                    {" "}first.
                  </div>
                )}

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
                    : otpSent
                    ? "Reset password"
                    : "Send OTP"}
                </button>
              </form>
            )}
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