import { Link, useNavigate } from "react-router-dom";
import {
  FiAward,
  FiShoppingBag,
  FiCheckCircle,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { optimizeImage } from "../utils/cloudinary";
import { INDIAN_STATES, CITIES_BY_STATE } from "../utils/indianAddressData";

import TryoutCharacter3D from "../components/TryoutCharacter3D";

export default function Tryouts({
  fallbackImage,
  filteredProducts,
  products,
  addToCart,
  user,
  userToken,
  apiUrl,
  setAccountOpen,
}) {
  // Status: loading | none | pending | approved | rejected | disqualified
  const [tryoutStatus, setTryoutStatus] = useState("loading");
  const [tryoutApplyOpen, setTryoutApplyOpen] = useState(false);
  const [tryoutForm, setTryoutForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pincode: "",
    previousProgram: "",
    otherProgram: "",
    reason: "",
  });
  const [tryoutSubmitting, setTryoutSubmitting] = useState(false);
  const [tryoutError, setTryoutError] = useState("");
  const [tryoutAgreed, setTryoutAgreed] = useState(false);
  const [tryoutIndex, setTryoutIndex] = useState(0);
  const navigate = useNavigate();

  const tryoutProducts = (products && products.length
    ? products
    : filteredProducts
  ).filter((p) => p && p.tryoutOnly);

  const tryoutApproved = tryoutStatus === "approved";

  // Currently featured product inside the Tryouts hero poster.
  const currentTryout = tryoutProducts.length
    ? tryoutProducts[tryoutIndex % tryoutProducts.length]
    : null;

  // Cities for the selected state in the application form.
  const tryoutStateCode =
    INDIAN_STATES.find((s) => s.label === tryoutForm.state)?.value || "";
  const tryoutCityOptions = CITIES_BY_STATE[tryoutStateCode] || [];

  useEffect(() => {
    if (!user || !userToken) {
      setTryoutStatus("none");
      return undefined;
    }

    let requestCancelled = false;

    const loadTryoutStatus = async () => {
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
        }
      } catch {
        if (!requestCancelled) {
          setTryoutStatus("none");
        }
      }
    };

    loadTryoutStatus();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, user, userToken]);

  const updateTryoutForm = (field, value) => {
    let cleanValue = value;

    if (field === "phone") {
      cleanValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (field === "pincode") {
      cleanValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setTryoutForm((current) => ({ ...current, [field]: cleanValue }));
  };

  const openTryoutApply = () => {
    setTryoutForm((current) => ({
      ...current,
      name: current.name || user?.name || "",
      phone: current.phone || user?.phone || "",
      email: current.email || user?.email || "",
    }));
    setTryoutApplyOpen(true);
  };

  const goToDashboard = () => {
    if (user) {
      navigate("/tryouts/dashboard");
    } else {
      setAccountOpen?.(true);
    }
  };

  const submitTryoutApply = async (event) => {
    event.preventDefault();
    setTryoutError("");

    if (!tryoutAgreed) {
      setTryoutError(
        "Please accept the Terms & Conditions to continue"
      );
      return;
    }

    try {
      setTryoutSubmitting(true);

      const response = await fetch(`${apiUrl}/api/tryouts/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          ...tryoutForm,
          replaceRejected: tryoutStatus === "rejected",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not submit your application");
      }

      setTryoutStatus("pending");
      setTryoutApplyOpen(false);
      setTryoutAgreed(false);
      setTryoutForm({
        name: "",
        phone: "",
        email: "",
        city: "",
        state: "",
        pincode: "",
        previousProgram: "",
        otherProgram: "",
        reason: "",
      });
    } catch (error) {
      setTryoutError(error.message);
    } finally {
      setTryoutSubmitting(false);
    }
  };

  return (
    <main className="tryouts-page">
      <div className="tryouts-page-head">
        <span className="eyebrow blue">EXCLUSIVE MEMBER PROGRAM</span>
        <h1>Dealroot Tryouts</h1>
        <p>
          Be among the first to test new products before everyone else.
          Approved Tryout members unlock exclusive Tryout deals.
        </p>
      </div>

      <div className="tryout-pills">
        <span className="tryout-pill">✦ WELCOME TO</span>
        <span className="tryout-pill tryout-pill-main">
          DEALROOT TESTERS COMMUNITY
        </span>
        <span className="tryout-pill">Products Free or Upto 90% Off</span>
      </div>

      <div className="tryout-hero">
        <TryoutCharacter3D variant="male" />

        <div
          className="tryout-carousel"
          role="region"
          aria-label="Tryout deals carousel"
        >
          {currentTryout ? (
            <div className="tryout-poster">
              <span className="tryout-poster-tag">✦ TRYOUT PICK</span>
              {!tryoutApproved && (
                <span className="tryout-poster-lock">🔒 Member only</span>
              )}
              <div className="tryout-poster-img">
                <img
                  src={optimizeImage(
                    currentTryout.images?.[0] || currentTryout.image,
                    500
                  )}
                  alt={currentTryout.name}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage;
                  }}
                />
              </div>
              <div className="tryout-poster-info">
                <p className="tryout-poster-brand">{currentTryout.brand}</p>
                <h3 className="tryout-poster-name">{currentTryout.name}</h3>
                <div className="tryout-poster-rating">
                  ★ <b>{currentTryout.rating}</b> ({currentTryout.reviews})
                </div>
                <div className="tryout-poster-features">
                  <span className="tryout-poster-feature">✅ 100% Original</span>
                  <span className="tryout-poster-feature">💸 Member Price</span>
                  <span className="tryout-poster-feature">🚚 Fast Delivery</span>
                  <span className="tryout-poster-feature">🔄 Easy Returns</span>
                </div>
                <div className="tryout-poster-price">
                  <small>YOURS AT JUST</small>
                  <strong>₹{currentTryout.price}</strong>
                  {currentTryout.originalPrice > currentTryout.price && (
                    <del>₹{currentTryout.originalPrice}</del>
                  )}
                </div>
                <Link
                  to={`/product/${currentTryout.id}`}
                  className="tryout-poster-shop"
                >
                  {tryoutApproved ? "Shop this pick →" : "View deal"}
                </Link>
              </div>
            </div>
          ) : (
            <div className="tryout-poster tryout-poster-empty">
              <div className="tryout-poster-img tryout-poster-empty-img">
                <span className="tryout-poster-empty-emoji">🛍️</span>
              </div>
              <div className="tryout-poster-info">
                <h3 className="tryout-poster-name">Tryout deals</h3>
                <p className="tryout-poster-empty-text">
                  New exclusive member products will appear here shortly.
                </p>
                <button
                  type="button"
                  className="tryout-poster-shop"
                  onClick={() =>
                    user ? goToDashboard() : setAccountOpen?.(true)
                  }
                >
                  Go to dashboard →
                </button>
              </div>
            </div>
          )}

          {tryoutProducts.length > 1 && (
            <>
              <button
                type="button"
                className="tryout-carousel-arrow prev"
                onClick={() =>
                  setTryoutIndex(
                    (i) =>
                      (i - 1 + tryoutProducts.length) % tryoutProducts.length
                  )
                }
                aria-label="Previous tryout deal"
              >
                ‹
              </button>
              <button
                type="button"
                className="tryout-carousel-arrow next"
                onClick={() =>
                  setTryoutIndex((i) => (i + 1) % tryoutProducts.length)
                }
                aria-label="Next tryout deal"
              >
                ›
              </button>
            </>
          )}
        </div>

        <TryoutCharacter3D variant="female" />
      </div>

      {/* How It Works — 3 simple steps */}
      <div className="tryout-how">
        <div className="tryout-how-head">
          <h3>How It Works</h3>
          <span>Earn rewards in 3 simple steps</span>
        </div>
        <div className="tryout-how-grid">
          <div className="tryout-how-step">
            <span className="tryout-how-icon step-purple">
              <FiShoppingBag size={24} />
            </span>
            <b>1. Select & Claim</b>
            <p>
              Choose from our exclusive Tryout products and claim your offer to
              get started.
            </p>
          </div>
          <div className="tryout-how-step">
            <span className="tryout-how-icon step-green">
              <FiCheckCircle size={24} />
            </span>
            <b>2. Purchase & Try</b>
            <p>
              Buy the product at special member prices and experience its
              quality first-hand.
            </p>
          </div>
          <div className="tryout-how-step">
            <span className="tryout-how-icon step-orange">
              <FiAward size={24} />
            </span>
            <b>3. Verify & Earn</b>
            <p>
              Share your honest review and earn rewards on your next Tryout
              deal.
            </p>
          </div>
        </div>
      </div>

      <div className="tryout-warning" role="note">
        <span className="tryout-warning-emoji">⚠️</span>
        <p>
          <b>This Tryout program is for new users or first-time users only.</b>
          If you have already tried this program before on any other platform
          (Freekamaal, Trybox, OPA, etc.), kindly do not join — we will not be
          responsible for your refund process or cashback issues.
        </p>
      </div>

      {!user ? (
        <div className="tryout-status-card tryout-locked">
          <span className="tryout-status-emoji">🔒</span>
          <h3>Tryout deals are for members only</h3>
          <p>
            Sign in to apply for the Dealroot Tryout program and unlock
            exclusive member deals.
          </p>
          <button
            type="button"
            className="tryout-apply-btn"
            onClick={() => setAccountOpen?.(true)}
          >
            Sign in & apply
          </button>
        </div>
      ) : tryoutStatus === "loading" ? (
        <div className="tryout-status-card">
          <span className="tryout-status-emoji">⏳</span>
          <h3>Checking your Tryout status...</h3>
        </div>
      ) : tryoutStatus === "pending" ? (
        <div className="tryout-status-card tryout-pending">
          <span className="tryout-status-emoji">⏳</span>
          <h3>Your application is under review</h3>
          <p>
            Our team is reviewing your Tryout application. You will be able to
            shop Tryout deals as soon as you are approved.
          </p>
        </div>
      ) : tryoutStatus === "rejected" ? (
        <div className="tryout-status-card tryout-rejected">
          <span className="tryout-status-emoji">😔</span>
          <h3>Your application was not approved</h3>
          <p>
            Unfortunately your Tryout application was not approved this time.
            You can apply again below.
          </p>
          <button
            type="button"
            className="tryout-apply-btn"
            onClick={openTryoutApply}
          >
            Apply again
          </button>
        </div>
      ) : tryoutStatus === "disqualified" ? (
        <div className="tryout-status-card tryout-rejected">
          <span className="tryout-status-emoji">🚫</span>
          <h3>Your Tryout membership was disqualified</h3>
          <p>
            Your membership was revoked by our team, so your Tryout deals are
            locked. You can apply again if you would like to rejoin the
            program.
          </p>
          <button
            type="button"
            className="tryout-apply-btn"
            onClick={openTryoutApply}
          >
            Apply again
          </button>
        </div>
      ) : tryoutApproved ? (
        <div className="tryout-status-card tryout-approved">
          <span className="tryout-status-emoji">🎉</span>
          <h3>You are a Tryout member!</h3>
          <p>
            Welcome to the club! You can now buy exclusive Tryout deals below
            at special member prices.
          </p>
        </div>
      ) : tryoutApplyOpen ? (
        <form className="tryout-form" onSubmit={submitTryoutApply}>
          <div className="tryout-form-head">
            <b>Apply for Dealroot Tryouts</b>
            <small>
              Tell us a little about yourself and why you would love to try our
              products.
            </small>
          </div>

          <label>
            Full name
            <input
              value={tryoutForm.name}
              onChange={(e) => updateTryoutForm("name", e.target.value)}
              required
              placeholder="Your full name"
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={tryoutForm.email}
              onChange={(e) => updateTryoutForm("email", e.target.value)}
              placeholder="you@example.com"
              readOnly
              title="Email from your account — cannot be changed here"
            />
            <small className="tryout-field-note">
              ✉️ Email from your account — not editable
            </small>
          </label>

          <label>
            Mobile number
            <input
              value={tryoutForm.phone}
              onChange={(e) => updateTryoutForm("phone", e.target.value)}
              inputMode="numeric"
              maxLength="10"
              placeholder="10-digit mobile number"
              readOnly
              title="Mobile number from your account — cannot be changed here"
            />
            <small className="tryout-field-note">
              📱 Number from your account — not editable
            </small>
          </label>

          <label>
            State
            <select
              value={tryoutForm.state}
              onChange={(e) => {
                updateTryoutForm("state", e.target.value);
                updateTryoutForm("city", "");
              }}
              required
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.value} value={state.label}>
                  {state.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            City
            <select
              value={tryoutForm.city}
              onChange={(e) => updateTryoutForm("city", e.target.value)}
              required
              disabled={!tryoutForm.state}
            >
              <option value="">
                {tryoutForm.state ? "Select city" : "Select state first"}
              </option>
              {tryoutCityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label>
            Pincode
            <input
              value={tryoutForm.pincode}
              onChange={(e) => updateTryoutForm("pincode", e.target.value)}
              inputMode="numeric"
              maxLength="6"
              placeholder="6-digit pincode"
              required
            />
          </label>

          <label className="tryout-field-full">
            Have you tried this program before?
            <select
              value={tryoutForm.previousProgram}
              onChange={(e) =>
                updateTryoutForm("previousProgram", e.target.value)
              }
            >
              <option value="">Select an option</option>
              <option value="Freekamaal">Freekamaal</option>
              <option value="Trybox">Trybox</option>
              <option value="OPA">OPA</option>
              <option value="Other">Other</option>
            </select>
          </label>

          {tryoutForm.previousProgram === "Other" && (
            <label>
              Other platform name
              <input
                value={tryoutForm.otherProgram}
                onChange={(e) =>
                  updateTryoutForm("otherProgram", e.target.value)
                }
                placeholder="Type the platform name"
                required
              />
            </label>
          )}

          <label className="tryout-field-full">
            Why do you want to be a Tryout member?
            <textarea
              rows="3"
              value={tryoutForm.reason}
              onChange={(e) => updateTryoutForm("reason", e.target.value)}
              placeholder="e.g. I love trying new skincare and sharing honest reviews..."
            />
          </label>

          <label className="tryout-agree">
            <input
              type="checkbox"
              checked={tryoutAgreed}
              onChange={(e) => setTryoutAgreed(e.target.checked)}
            />
            <span>
              I have read and agree to the{" "}
              <Link to="/tryout-policy" target="_blank">
                Terms &amp; Conditions
              </Link>{" "}
              of the Dealroot Tryouts program.
            </span>
          </label>

          {tryoutError && <div className="tryout-error">{tryoutError}</div>}

          <div className="tryout-form-actions">
            <button
              type="button"
              className="tryout-cancel-btn"
              onClick={() => setTryoutApplyOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tryout-submit-btn"
              disabled={tryoutSubmitting}
            >
              {tryoutSubmitting ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>
      ) : (
        <div className="tryout-status-card tryout-locked">
          <span className="tryout-status-emoji">📝</span>
          <h3>Become a Tryout member</h3>
          <p>
            Apply for free and get access to exclusive Tryout deals. Your
            application will be reviewed by our team.
          </p>
          <button
            type="button"
            className="tryout-apply-btn"
            onClick={openTryoutApply}
          >
            Apply now
          </button>
        </div>
      )}

      <div className="tryout-products-head" id="tryout-deals">
        <h3>
          {tryoutApproved ? "🛍️ Your Tryout deals" : "Tryout member deals"}
        </h3>
        <span>
          {tryoutApproved
            ? "Member price unlocked — shop below"
            : "Not eligible yet — kindly apply for Tryout member to unlock"}
        </span>
      </div>

      {tryoutProducts.length === 0 ? (
        <div className="tryout-empty">
          <span>🛍️</span>
          <b>No Tryout deals yet</b>
          <p>
            The DealRoot team is preparing exclusive Tryout products. New
            member deals will appear here soon.
          </p>
        </div>
      ) : (
        <div className="tryout-grid">
          {tryoutProducts.map((product) => {
            const discount =
              product.originalPrice > product.price
                ? Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )
                : 0;

            return (
              <div
                className={`tryout-card ${
                  tryoutApproved ? "is-member" : "is-locked"
                }`}
                key={product.id}
              >
                <div className="tryout-card-img">
                  <span className="tryout-badge">TRYOUT</span>
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={optimizeImage(
                        product.images?.[0] || product.image,
                        400
                      )}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                  {!tryoutApproved && (
                    <div className="tryout-lock-overlay">
                      <span>🔒</span>
                      <b>Not eligible</b>
                      <small>Kindly apply for Tryout member</small>
                    </div>
                  )}
                </div>

                <div className="tryout-card-body">
                  <p className="tryout-brand">{product.brand}</p>
                  <h4>
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                  </h4>
                  <div className="tryout-price">
                    <strong>₹{product.price}</strong>
                    {product.originalPrice > product.price && (
                      <del>₹{product.originalPrice}</del>
                    )}
                    {discount > 0 && (
                      <span className="tryout-discount">{discount}% off</span>
                    )}
                  </div>

                  {tryoutApproved ? (
                    <button
                      type="button"
                      className="tryout-buy-btn"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock <= 0 ? "Out of Stock" : "🛒 Buy now"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="tryout-buy-btn tryout-buy-locked"
                      onClick={() =>
                        user ? openTryoutApply() : setAccountOpen?.(true)
                      }
                    >
                      Apply for Tryout member
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
