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

  const tryoutApproved = tryoutStatus === "approved";

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
              onClick={() => navigate("/tryouts")}
            >
              🛍️ Browse Offers
            </button>
            <button
              type="button"
              className="tryout-action-btn tryout-action-ghost"
              onClick={() =>
                window.open(
                  `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
                    "Tryout Purchase Form — " + (user.name || "Member")
                  )}&body=${encodeURIComponent(
                    `Hello DealRoot team,\n\nI am a Tryout member (${
                      user.name || ""
                    }, ${user.email || ""}) and I want to submit my purchase details:\n\nProduct: \nOrder ID: \nAmount: \n\nThank you!`
                  )}`,
                  "_blank"
                )
              }
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
              onClick={() => navigate("/tryouts")}
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
    </main>
  );
}
