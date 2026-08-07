import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

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
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({
    orderId: "",
    orderAmount: "",
    otherInfo: "",
  });
  const [refundDeliveryFile, setRefundDeliveryFile] = useState(null);
  const [refundReviewFiles, setRefundReviewFiles] = useState([]);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [refundSubmitted, setRefundSubmitted] = useState(false);
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", upiId: "" });
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSubmitted, setWithdrawSubmitted] = useState(false);

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

  const openWithdrawForm = () => {
    setWithdrawForm({ amount: "", upiId: "" });
    setWithdrawError("");
    setWithdrawSubmitted(false);
    setWithdrawOpen(true);
  };

  const submitWithdraw = async (event) => {
    event.preventDefault();
    setWithdrawSubmitting(true);
    setWithdrawError("");

    try {
      const response = await fetch(`${apiUrl}/api/tryouts/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          amount: withdrawForm.amount,
          upiId: withdrawForm.upiId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit the withdrawal");
      }

      setDashboard((current) => ({
        ...current,
        cashbackAvailable:
          data.application?.cashbackAvailable ??
          current.cashbackAvailable,
        cashbackPending:
          data.application?.cashbackPending ?? current.cashbackPending,
        withdrawals: (data.application?.withdrawals || [])
          .slice()
          .reverse(),
      }));
      setWithdrawSubmitted(true);
    } catch (error) {
      setWithdrawError(
        error instanceof TypeError
          ? "Could not connect to the server. Please try again."
          : error.message
      );
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const openRefundForm = () => {
    setRefundForm({ orderId: "", orderAmount: "", otherInfo: "" });
    setRefundDeliveryFile(null);
    setRefundReviewFiles([]);
    setRefundError("");
    setRefundSubmitted(false);
    setRefundOpen(true);
  };

  const submitRefundForm = async (event) => {
    event.preventDefault();
    setRefundSubmitting(true);
    setRefundError("");

    try {
      const formData = new FormData();
      formData.append("orderId", refundForm.orderId);
      formData.append("orderAmount", refundForm.orderAmount);
      formData.append("otherInfo", refundForm.otherInfo);
      if (refundDeliveryFile) {
        formData.append("deliveryScreenshot", refundDeliveryFile);
      }
      refundReviewFiles.forEach((file) => {
        formData.append("reviewFiles", file);
      });

      const response = await fetch(`${apiUrl}/api/tryouts/refund-form`, {
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

      setRefundSubmitted(true);
    } catch (error) {
      setRefundError(
        error instanceof TypeError
          ? "Could not connect to the server. Please try again."
          : error.message
      );
    } finally {
      setRefundSubmitting(false);
    }
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

  const loadDashboard = useCallback(async () => {
    if (!user || !userToken) return;

    try {
      const response = await fetch(`${apiUrl}/api/tryouts/my`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) return;

      setTryoutStatus(
        data.application ? data.application.status : "none"
      );
      setDashboard(data.dashboard || INITIAL_DASHBOARD);
    } catch {
      // Silent — keep whatever is currently shown.
    }
  }, [apiUrl, user, userToken]);

  useEffect(() => {
    if (!user || !userToken) {
      setTryoutStatus("none");
      return undefined;
    }

    loadDashboard();

    // Poll every 15s + on focus so admin approvals / payouts update live.
    const pollTimer = window.setInterval(loadDashboard, 15000);
    const refocus = () => loadDashboard();
    window.addEventListener("focus", refocus);

    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("focus", refocus);
    };
  }, [loadDashboard, user, userToken]);

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
              onClick={openRefundForm}
            >
              📋 Submit Refund Form
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-ghost"
              onClick={() => setResponsesOpen(true)}
            >
              🕒 Form Response History
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-dark"
              onClick={openWithdrawForm}
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

          {/* Withdrawal history — every payout request, newest first */}
          <section className="tryout-withdraw-section">
            <div className="tryout-cashback-head">
              <div>
                <h3>💳 Withdrawal History</h3>
                <p>
                  Every cashback payout you requested, with its live
                  status.
                </p>
              </div>
            </div>

            {(dashboard.withdrawals || []).length === 0 ? (
              <div className="tryout-cashback-empty">
                <span>💳</span>
                <b>No withdrawals yet</b>
                <p>
                  When you request a cashback payout, it will appear here
                  with its status.
                </p>
              </div>
            ) : (
              <div className="tryout-withdraw-list">
                {(dashboard.withdrawals || []).map((entry) => (
                  <div
                    className="tryout-withdraw-item"
                    key={entry._id}
                  >
                    <div className="tryout-withdraw-item-ref">
                      <small>REFERENCE ID</small>
                      <b>
                        {entry.referenceId ||
                          `REQ_${String(entry._id)
                            .slice(-8)
                            .toUpperCase()}`}
                      </b>
                    </div>
                    <div className="tryout-withdraw-item-upi">
                      <small>WITHDRAWAL UPI</small>
                      <b>{entry.upiId || "—"}</b>
                    </div>
                    <div className="tryout-withdraw-item-amt">
                      <small>AMOUNT</small>
                      <b>
                        ₹
                        {(entry.amount || 0).toLocaleString("en-IN")}
                      </b>
                    </div>
                    <div className="tryout-withdraw-item-status">
                      <small>STATUS</small>
                      <span
                        className={`tryout-withdraw-badge ${entry.status}`}
                      >
                        {entry.status === "paid"
                          ? "SUCCESSFUL"
                          : entry.status === "rejected"
                          ? "REJECTED"
                          : "PROCESSING"}
                      </span>
                    </div>
                    <div className="tryout-withdraw-item-date">
                      <small>DATE</small>
                      <b>
                        {new Date(
                          entry.processedAt || entry.requestedAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </b>
                    </div>
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

      {/* Refund form modal — Google Forms style */}
      {refundOpen && (
        <div
          className="tryout-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !refundSubmitting) {
              setRefundOpen(false);
            }
          }}
        >
          <div
            className="tryout-purchase-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Submit Refund Form"
          >
            <header className="tryout-purchase-head">
              <div>
                <span className="tryout-purchase-eyebrow">
                  DEALROOT TRYOUTS
                </span>
                <h3>Submit Refund Form</h3>
                <p>
                  Received your product? Submit your delivery and review
                  proof so we can verify and process your refund.
                </p>
              </div>
              <button
                type="button"
                className="tryout-modal-close"
                onClick={() => setRefundOpen(false)}
                disabled={refundSubmitting}
                aria-label="Close form"
              >
                &times;
              </button>
            </header>

            {refundSubmitted ? (
              <div className="tryout-purchase-success">
                <span className="tryout-purchase-success-icon">✅</span>
                <h4>Form submitted!</h4>
                <p>
                  Your refund form has been filled.{" "}
                  <b>Please do not cancel your order</b> — our team will
                  verify your delivery and review, then process your
                  refund / cashback. A confirmation email is on its way to
                  you.
                </p>
                <button
                  type="button"
                  className="tryout-purchase-done"
                  onClick={() => setRefundOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                className="tryout-purchase-form"
                onSubmit={submitRefundForm}
              >
                <label>
                  Email *
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    disabled
                    className="tryout-refund-email"
                  />
                  <small className="tryout-purchase-file-name">
                    ✉️ Email from your account — not editable
                  </small>
                </label>

                <label>
                  Order Id (Fill Correct Id Only) *
                  <input
                    name="orderId"
                    type="text"
                    value={refundForm.orderId}
                    onChange={(event) =>
                      setRefundForm((current) => ({
                        ...current,
                        orderId: event.target.value,
                      }))
                    }
                    placeholder="Your answer"
                    required
                  />
                </label>

                <label>
                  Order Amount (₹) *
                  <input
                    name="orderAmount"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={refundForm.orderAmount}
                    onChange={(event) =>
                      setRefundForm((current) => ({
                        ...current,
                        orderAmount: event.target.value,
                      }))
                    }
                    placeholder="Your answer"
                    required
                  />
                </label>

                <label className="tryout-purchase-file">
                  Delivery Screenshot (should have clear order id and order
                  status) *
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setRefundDeliveryFile(
                        event.target.files?.[0] || null
                      )
                    }
                    required
                  />
                  {refundDeliveryFile && (
                    <span className="tryout-purchase-file-name">
                      📎 {refundDeliveryFile.name}
                    </span>
                  )}
                </label>

                <label className="tryout-purchase-file">
                  Review (Product, 5 Star Rating, Written Content) *
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setRefundReviewFiles(
                        Array.from(event.target.files || []).slice(0, 5)
                      )
                    }
                    required
                  />
                  {refundReviewFiles.length > 0 && (
                    <span className="tryout-purchase-file-name">
                      📎 {refundReviewFiles.length} file(s) selected
                    </span>
                  )}
                </label>

                <label>
                  Other Information (Live review link or something
                  important)
                  <textarea
                    name="otherInfo"
                    rows="3"
                    value={refundForm.otherInfo}
                    onChange={(event) =>
                      setRefundForm((current) => ({
                        ...current,
                        otherInfo: event.target.value,
                      }))
                    }
                    placeholder="Live review link or something important"
                  />
                </label>

                {refundError && (
                  <div className="tryout-purchase-error" role="alert">
                    {refundError}
                  </div>
                )}

                <div className="tryout-purchase-actions">
                  <button
                    type="button"
                    className="tryout-purchase-clear"
                    onClick={() => {
                      setRefundForm({
                        orderId: "",
                        orderAmount: "",
                        otherInfo: "",
                      });
                      setRefundDeliveryFile(null);
                      setRefundReviewFiles([]);
                      setRefundError("");
                    }}
                  >
                    Clear form
                  </button>
                  <button
                    type="submit"
                    className="tryout-purchase-submit"
                    disabled={refundSubmitting}
                  >
                    {refundSubmitting ? "Submitting..." : "Submit"}
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

      {/* Form Response History modal — every submission the member made */}
      {responsesOpen && (
        <div
          className="tryout-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setResponsesOpen(false);
            }
          }}
        >
          <div
            className="tryout-purchase-modal tryout-responses-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Form Response History"
          >
            <header className="tryout-purchase-head">
              <div>
                <span className="tryout-purchase-eyebrow">
                  DEALROOT TRYOUTS
                </span>
                <h3>🕒 Form Response History</h3>
                <p>
                  Every purchase and refund form you have submitted, with
                  their verification status.
                </p>
              </div>
              <button
                type="button"
                className="tryout-modal-close"
                onClick={() => setResponsesOpen(false)}
                aria-label="Close history"
              >
                &times;
              </button>
            </header>

            <div className="tryout-responses-body">
              {(dashboard.purchaseForms || []).length === 0 &&
              (dashboard.refundForms || []).length === 0 ? (
                <div className="tryout-responses-empty">
                  <span>📭</span>
                  <b>No form responses yet</b>
                  <p>
                    When you submit a purchase or refund form, it will
                    appear here with its status.
                  </p>
                </div>
              ) : (
                <>
                  {(dashboard.purchaseForms || []).length > 0 && (
                    <div className="tryout-responses-group">
                      <b className="tryout-pf-title">
                        📋 Purchase Forms (
                        {(dashboard.purchaseForms || []).length})
                      </b>
                      {dashboard.purchaseForms.map((form) => (
                        <div
                          className="tryout-responses-card"
                          key={form._id}
                        >
                          <div className="tryout-pf-top">
                            <span
                              className={`tryout-responses-badge ${form.status}`}
                            >
                              {String(
                                form.status || "submitted"
                              ).toUpperCase()}
                            </span>
                            <small>
                              {new Date(
                                form.submittedAt
                              ).toLocaleString("en-IN")}
                            </small>
                          </div>
                          <div className="tryout-pf-details">
                            <span>
                              <b>Phone:</b> {form.phoneAtStore || "—"}
                            </span>
                            <span>
                              <b>Profile:</b>{" "}
                              {form.profileName || "—"}
                            </span>
                            {form.otherInfo && (
                              <span>
                                <b>Info:</b> {form.otherInfo}
                              </span>
                            )}
                          </div>
                          {form.screenshotUrl && (
                            <div className="tryout-responses-actions">
                              <a
                                href={form.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tryout-pf-shot"
                              >
                                🖼️ View screenshot
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(dashboard.refundForms || []).length > 0 && (
                    <div className="tryout-responses-group">
                      <b className="tryout-pf-title">
                        📦 Refund Forms ({(dashboard.refundForms || []).length})
                      </b>
                      {dashboard.refundForms.map((form) => (
                        <div
                          className="tryout-responses-card"
                          key={form._id}
                        >
                          <div className="tryout-pf-top">
                            <span
                              className={`tryout-responses-badge ${form.status}`}
                            >
                              {String(
                                form.status || "submitted"
                              ).toUpperCase()}
                            </span>
                            <small>
                              {new Date(
                                form.submittedAt
                              ).toLocaleString("en-IN")}
                            </small>
                          </div>
                          <div className="tryout-pf-details">
                            <span>
                              <b>Order id:</b> {form.orderId || "—"}
                            </span>
                            <span>
                              <b>Order amount:</b> ₹
                              {(form.orderAmount || 0).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                            {form.otherInfo && (
                              <span>
                                <b>Info:</b> {form.otherInfo}
                              </span>
                            )}
                          </div>
                          {(form.deliveryScreenshotUrl ||
                            (form.reviewFiles || []).length > 0) && (
                            <div className="tryout-responses-actions">
                              {form.deliveryScreenshotUrl && (
                                <a
                                  href={form.deliveryScreenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="tryout-pf-shot"
                                >
                                  🖼️ Delivery shot
                                </a>
                              )}
                              {(form.reviewFiles || []).map((url, index) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="tryout-pf-shot"
                                >
                                  Review {index + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal modal — request cashback payout to UPI */}
      {withdrawOpen && (
        <div
          className="tryout-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !withdrawSubmitting) {
              setWithdrawOpen(false);
            }
          }}
        >
          <div
            className="tryout-purchase-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Withdraw Cashback"
          >
            <header className="tryout-purchase-head">
              <div>
                <span className="tryout-purchase-eyebrow">
                  DEALROOT TRYOUTS
                </span>
                <h3>💳 Withdraw Cashback</h3>
                <p>
                  Transfer your available cashback to your UPI account.
                </p>
              </div>
              <button
                type="button"
                className="tryout-modal-close"
                onClick={() => setWithdrawOpen(false)}
                disabled={withdrawSubmitting}
                aria-label="Close withdrawal"
              >
                &times;
              </button>
            </header>

            {withdrawSubmitted ? (
              <div className="tryout-purchase-success">
                <span className="tryout-purchase-success-icon">💳</span>
                <h4>Withdrawal request submitted!</h4>
                <p>
                  Our team will pay ₹
                  {(withdrawForm.amount || 0).toLocaleString("en-IN")}{" "}
                  to <b>{withdrawForm.upiId}</b> shortly. You will be
                  notified once it is processed.
                </p>
                <button
                  type="button"
                  className="tryout-purchase-done"
                  onClick={() => setWithdrawOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                className="tryout-purchase-form"
                onSubmit={submitWithdraw}
              >
                <div className="tryout-withdraw-balance">
                  <span>Available cashback</span>
                  <b>
                    ₹
                    {(dashboard.cashbackAvailable || 0).toLocaleString(
                      "en-IN"
                    )}
                  </b>
                </div>

                <label>
                  Amount to withdraw (₹) *
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    max={dashboard.cashbackAvailable || 0}
                    step="1"
                    inputMode="numeric"
                    value={withdrawForm.amount}
                    onChange={(event) =>
                      setWithdrawForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder={`Your answer (max ₹${
                      dashboard.cashbackAvailable || 0
                    })`}
                    required
                  />
                </label>

                <label>
                  UPI ID *
                  <input
                    name="upiId"
                    type="text"
                    value={withdrawForm.upiId}
                    onChange={(event) =>
                      setWithdrawForm((current) => ({
                        ...current,
                        upiId: event.target.value,
                      }))
                    }
                    placeholder="yourname@upi"
                    required
                  />
                </label>

                {withdrawError && (
                  <div className="tryout-purchase-error" role="alert">
                    {withdrawError}
                  </div>
                )}

                <div className="tryout-purchase-actions">
                  <button
                    type="button"
                    className="tryout-purchase-clear"
                    onClick={() =>
                      setWithdrawForm({ amount: "", upiId: "" })
                    }
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="tryout-purchase-submit"
                    disabled={
                      withdrawSubmitting ||
                      (dashboard.cashbackAvailable || 0) <= 0
                    }
                  >
                    {withdrawSubmitting ? "Submitting..." : "Withdraw"}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
