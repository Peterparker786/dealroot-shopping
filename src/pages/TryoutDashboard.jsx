import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Owner contact for Tryout forms / withdrawals.
const OWNER_EMAIL = "dealroot.store@gmail.com";

// Status: loading | none | pending | approved | rejected | disqualified
const INITIAL_DASHBOARD = {
  totalOrders: 0,
  cashbackAvailable: 0,
  cashbackPending: 0,
  cashbackReceived: 0,
  history: [],
};

export default function TryoutDashboard({
  user,
  userToken,
  apiUrl,
  setAccountOpen,
}) {
  const navigate = useNavigate();
  const [tryoutStatus, setTryoutStatus] = useState("loading");
  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    phoneAtStore: user?.phone || "",
    profileName: "",
    otherInfo: "",
  });
  const [purchaseFile, setPurchaseFile] = useState(null);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSubmitted, setPurchaseSubmitted] = useState(false);

  const tryoutApproved = tryoutStatus === "approved";

  const openPurchaseForm = () => {
    setPurchaseForm({
      phoneAtStore: user?.phone || "",
      profileName: "",
      otherInfo: "",
    });
    setPurchaseFile(null);
    setPurchaseError("");
    setPurchaseSubmitted(false);
    setPurchaseOpen(true);
  };

  const submitPurchaseForm = async (event) => {
    event.preventDefault();
    setPurchaseSubmitting(true);
    setPurchaseError("");

    try {
      const formData = new FormData();
      formData.append("phoneAtStore", purchaseForm.phoneAtStore);
      formData.append("profileName", purchaseForm.profileName);
      formData.append("otherInfo", purchaseForm.otherInfo);
      if (purchaseFile) {
        formData.append("screenshot", purchaseFile);
      }

      const response = await fetch(`${apiUrl}/api/tryouts/purchase-form`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit the form");
      }

      setPurchaseSubmitted(true);
    } catch (error) {
      setPurchaseError(
        error instanceof TypeError
          ? "Could not connect to the server. Please try again."
          : error.message
      );
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user || !userToken) {
      setTryoutStatus("none");
      return undefined;
    }

    let requestCancelled = false;

    const loadDashboard = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/tryouts/my`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        const data = await response.json();

        if (!requestCancelled) {
          setTryoutStatus(
            data.application ? data.application.status : "none"
          );
          setDashboard(data.dashboard || INITIAL_DASHBOARD);
        }
      } catch {
        if (!requestCancelled) {
          setTryoutStatus("none");
        }
      }
    };

    loadDashboard();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, user, userToken]);

  // Not signed in → ask the visitor to sign in first.
  if (!user) {
    return (
      <main className="tryouts-page">
        <div className="tryout-dashboard tryout-dash-guard">
          <span className="tryout-dash-avatar">D</span>
          <h2>Sign in to view your Tryout dashboard</h2>
          <p>
            Your member status, cashback and exclusive deals live here once
            you are signed in.
          </p>
          <button
            type="button"
            className="tryout-browse-offers"
            onClick={() => setAccountOpen?.(true)}
          >
            Sign in now
          </button>
        </div>
      </main>
    );
  }

  const statusText =
    tryoutStatus === "loading"
      ? "⏳ Checking your membership..."
      : tryoutApproved
      ? "⭐ You are a Tryout member"
      : tryoutStatus === "pending"
      ? "⏳ Application under review"
      : tryoutStatus === "disqualified"
      ? "🚫 Membership disqualified"
      : tryoutStatus === "rejected"
      ? "😔 Application not approved"
      : "📝 Not a member yet — apply below";

  const stats = [
    {
      label: "Total Orders",
      value: String(dashboard.totalOrders || 0),
      icon: "🛍️",
      className: "tryout-stat-bag",
    },
    {
      label: "Available Cashback",
      value: `₹${(dashboard.cashbackAvailable || 0).toLocaleString("en-IN")}`,
      icon: "✅",
      className: "tryout-stat-green",
    },
    {
      label: "Cashback Pending",
      value: `₹${(dashboard.cashbackPending || 0).toLocaleString("en-IN")}`,
      icon: "👛",
      className: "tryout-stat-blue",
    },
    {
      label: "Cashback Received",
      value: `₹${(dashboard.cashbackReceived || 0).toLocaleString("en-IN")}`,
      icon: "🏆",
      className: "tryout-stat-gold",
    },
  ];

  const filteredHistory = (dashboard.history || []).filter((entry) => {
    if (historyFilter !== "all" && entry.status !== historyFilter) {
      return false;
    }
    if (
      searchQuery.trim() &&
      !`${entry.note || ""} ₹${entry.amount || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const statusLabel = (status) =>
    status === "received"
      ? "RECEIVED"
      : status === "pending"
      ? "PENDING"
      : "AVAILABLE";

  return (
    <main className="tryouts-page">
      <div className="tryout-dash-page-head">
        <span className="eyebrow blue">TRYOUT MEMBER DASHBOARD</span>
        <h1>
          Hello, <b>{user.name || "Member"}!</b>
        </h1>
        <p>
          Manage your Tryout membership, track your claimed rewards and
          browse the exclusive deals we open for you.
        </p>
      </div>

      {/* Status ribbon */}
      <div className={`tryout-dash-ribbon ${tryoutApproved ? "approved" : ""}`}>
        <span className="tryout-dash-avatar">
          {user.name?.charAt(0).toUpperCase() || "D"}
        </span>
        <div>
          <b>Welcome, {user.name || "Member"}!</b>
          <small>{statusText}</small>
        </div>
      </div>

      {tryoutApproved ? (
        <>
          {/* Stats cards */}
          <div className="tryout-stat-grid">
            {stats.map((stat) => (
              <div
                className={`tryout-stat-card ${stat.className}`}
                key={stat.label}
              >
                <span className="tryout-stat-icon">{stat.icon}</span>
                <small>{stat.label}</small>
                <b>{stat.value}</b>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="tryout-action-row">
            <button
              type="button"
              className="tryout-action-btn tryout-action-primary"
              onClick={() => navigate("/tryouts/offers")}
            >
              🛍️ Browse Offers
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-ghost"
              onClick={openPurchaseForm}
            >
              📝 Submit Purchase Form
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-ghost"
              onClick={() =>
                window.open(
                  `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
                    "Tryout Refund Form — " + (user.name || "Member")
                  )}&body=${encodeURIComponent(
                    `Hello DealRoot team,\n\nI am a Tryout member (${
                      user.name || ""
                    }, ${user.email || ""}) and I want to submit a refund request:\n\nProduct: \nOrder ID: \nReason: \n\nThank you!`
                  )}`,
                  "_blank"
                )
              }
            >
              📋 Submit Refund Form
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-ghost"
              onClick={() =>
                window.open(
                  `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
                    "Form Response History — " + (user.name || "Member")
                  )}`,
                  "_blank"
                )
              }
            >
              🕒 Form Response History
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-dark"
              onClick={() =>
                window.open(
                  `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
                    "Tryout Withdrawal Request — " + (user.name || "Member")
                  )}&body=${encodeURIComponent(
                    `Hello DealRoot team,\n\nI am a Tryout member (${
                      user.name || ""
                    }, ${user.email || ""}) and I want to withdraw my cashback.\n\nAvailable cashback: ₹${
                      dashboard.cashbackAvailable || 0
                    }\nUPI / payment details: \n\nThank you!`
                  )}`,
                  "_blank"
                )
              }
            >
              💳 Withdrawal
            </button>
          </div>

          {/* Cashback history */}
          <section className="tryout-cashback-section">
            <div className="tryout-cashback-head">
              <div>
                <h3>🕒 Cashback History</h3>
                <p>Every reward added by the DealRoot team, tracked here.</p>
              </div>
              <div className="tryout-cashback-tools">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search amount or note..."
                />
                <select
                  value={historyFilter}
                  onChange={(event) => setHistoryFilter(event.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                </select>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="tryout-cashback-empty">
                <span>💰</span>
                <b>No cashback yet</b>
                <p>
                  When the DealRoot team adds cashback for your Tryout
                  purchases, it will appear here.
                </p>
              </div>
            ) : (
              <div className="tryout-cashback-grid">
                {filteredHistory.map((entry) => (
                  <div className="tryout-cashback-card" key={entry._id}>
                    <div className="tryout-cashback-card-head">
                      <span className="tryout-cashback-store">
                        🛒 DEALROOT
                      </span>
                      <span
                        className={`tryout-cashback-badge ${entry.status}`}
                      >
                        {statusLabel(entry.status)}
                      </span>
                    </div>
                    <b className="tryout-cashback-amount">
                      ₹{(entry.amount || 0).toLocaleString("en-IN")}
                    </b>
                    {entry.note && (
                      <p className="tryout-cashback-note">{entry.note}</p>
                    )}
                    <small className="tryout-cashback-date">
                      {new Date(entry.createdAt).toLocaleString("en-IN")}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        /* Non-approved member: status + apply CTA */
        <div className="tryout-dashboard">
          <div className="tryout-dash-stats">
            <div className="tryout-dash-stat">
              <b>{tryoutStatus === "pending" ? "⏳" : "—"}</b>
              <span>Application</span>
            </div>
            <div className="tryout-dash-stat">
              <b>{tryoutApproved ? "LIVE" : "—"}</b>
              <span>Member status</span>
            </div>
            <div className="tryout-dash-stat">
              <b>₹0</b>
              <span>Cashback</span>
            </div>
          </div>

          <div className="tryout-dash-actions">
            <button
              type="button"
              className="tryout-browse-offers"
              onClick={() => navigate("/tryouts/offers")}
            >
              Browse Offers →
            </button>
            <button
              type="button"
              className="tryout-dash-apply"
              onClick={() => navigate("/tryouts")}
            >
              Apply now
            </button>
          </div>
        </div>
      )}

      <div className="tryout-dash-help">
        <Link to="/tryouts">← Back to Tryout deals</Link>
      </div>

      {/* Purchase form modal — Google Forms style */}
      {purchaseOpen && (
        <div
          className="tryout-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !purchaseSubmitting
            ) {
              setPurchaseOpen(false);
            }
          }}
        >
          <div
            className="tryout-purchase-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Submit Purchase Form"
          >
            <header className="tryout-purchase-head">
              <div>
                <span className="tryout-purchase-eyebrow">
                  DEALROOT TRYOUTS
                </span>
                <h3>Submit Purchase Form</h3>
                <p>
                  Tell us about the product you bought so we can verify it
                  and add it to your dashboard.
                </p>
              </div>
              <button
                type="button"
                className="tryout-modal-close"
                onClick={() => setPurchaseOpen(false)}
                disabled={purchaseSubmitting}
                aria-label="Close form"
              >
                &times;
              </button>
            </header>

            {purchaseSubmitted ? (
              <div className="tryout-purchase-success">
                <span className="tryout-purchase-success-icon">✅</span>
                <h4>Form submitted!</h4>
                <p>
                  Your cashback form has been filled.{" "}
                  <b>Please do not cancel your order</b> — our team will
                  verify it and add it to your dashboard. A confirmation
                  email is on its way to you.
                </p>
                <button
                  type="button"
                  className="tryout-purchase-done"
                  onClick={() => setPurchaseOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                className="tryout-purchase-form"
                onSubmit={submitPurchaseForm}
              >
                <label>
                  Phone Number At Purchase Store *
                  <input
                    name="phoneAtStore"
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    value={purchaseForm.phoneAtStore}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        phoneAtStore: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      }))
                    }
                    placeholder="Your answer"
                    required
                  />
                </label>

                <label>
                  Profile Name On Amazon / Flipkart / Myntra / Meesho /{" "}
                  Blinkit *
                  <input
                    name="profileName"
                    type="text"
                    value={purchaseForm.profileName}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        profileName: event.target.value,
                      }))
                    }
                    placeholder="Your answer"
                    required
                  />
                </label>

                <label className="tryout-purchase-file">
                  Order Screenshot (order id, order date, order amount,
                  product — should be visible) *
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setPurchaseFile(event.target.files?.[0] || null)
                    }
                    required
                  />
                  {purchaseFile && (
                    <span className="tryout-purchase-file-name">
                      📎 {purchaseFile.name}
                    </span>
                  )}
                </label>

                <label>
                  Other Informations
                  <textarea
                    name="otherInfo"
                    rows="3"
                    value={purchaseForm.otherInfo}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        otherInfo: event.target.value,
                      }))
                    }
                    placeholder="Order ID, amount, anything else..."
                  />
                </label>

                {purchaseError && (
                  <div
                    className="tryout-purchase-error"
                    role="alert"
                  >
                    {purchaseError}
                  </div>
                )}

                <div className="tryout-purchase-actions">
                  <button
                    type="button"
                    className="tryout-purchase-clear"
                    onClick={() => {
                      setPurchaseForm({
                        phoneAtStore: user?.phone || "",
                        profileName: "",
                        otherInfo: "",
                      });
                      setPurchaseFile(null);
                      setPurchaseError("");
                    }}
                  >
                    Clear form
                  </button>
                  <button
                    type="submit"
                    className="tryout-purchase-submit"
                    disabled={purchaseSubmitting}
                  >
                    {purchaseSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>

                <p className="tryout-purchase-note">
                  A confirmation email will be sent to you after
                  submitting. Never share passwords.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
