import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { optimizeImage } from "../utils/cloudinary";

export default function TryoutOffers({
  fallbackImage,
  products,
  filteredProducts,
  addToCart,
  user,
  userToken,
  apiUrl,
  setAccountOpen,
}) {
  const navigate = useNavigate();
  const [tryoutStatus, setTryoutStatus] = useState("loading");

  const tryoutProducts = (products && products.length
    ? products
    : filteredProducts
  ).filter((p) => p && p.tryoutOnly);

  const tryoutApproved = tryoutStatus === "approved";

  useEffect(() => {
    if (!user || !userToken) {
      setTryoutStatus("none");
      return undefined;
    }

    let requestCancelled = false;

    const loadStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/tryouts/my`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await response.json();
        if (!requestCancelled) {
          setTryoutStatus(
            data.application ? data.application.status : "none"
          );
        }
      } catch {
        if (!requestCancelled) setTryoutStatus("none");
      }
    };

    loadStatus();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, user, userToken]);

  // Not signed in → ask to sign in.
  if (!user) {
    return (
      <main className="tryouts-page">
        <div className="tryout-dashboard tryout-dash-guard">
          <span className="tryout-dash-avatar">D</span>
          <h2>Sign in to browse Tryout offers</h2>
          <p>
            Tryout member deals are exclusive. Sign in to see what is
            available for you.
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

  const discount = (p) =>
    p.originalPrice > p.price
      ? Math.round(
          ((p.originalPrice - p.price) / p.originalPrice) * 100
        )
      : 0;

  const buyTarget = (product) => {
    const url = product.buyLink?.trim();
    if (!url) return null;
    // Allow http(s) links and relative site paths.
    return /^https?:\/\//i.test(url) ? url : url.startsWith("/") ? url : null;
  };

  return (
    <main className="tryouts-page">
      <div className="tryout-dash-page-head">
        <span className="eyebrow blue">TRYOUT MEMBER OFFERS</span>
        <h1>Browse Offers</h1>
        <p>
          Exclusive member deals picked for the Dealroot Tryout community.
          {tryoutApproved
            ? " Your member price is unlocked — shop below!"
            : " Apply for the Tryout program to unlock these deals."}
        </p>
      </div>

      <div className="tryout-offers-toolbar">
        <div>
          <b>{tryoutProducts.length}</b>
          <span>deals available</span>
        </div>
        <button
          type="button"
          className="tryout-dash-apply"
          onClick={() => navigate("/tryouts/dashboard")}
        >
          ← My dashboard
        </button>
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
        <div className="tryout-offers-grid">
          {tryoutProducts.map((product) => {
            const d = discount(product);
            return (
              <article
                className={`tryout-offer-card ${
                  tryoutApproved ? "is-member" : "is-locked"
                }`}
                key={product.id}
              >
                <div className="tryout-offer-img">
                  <span className="tryout-badge">TRYOUT PICK</span>
                  {!tryoutApproved && (
                    <span className="tryout-poster-lock">🔒 Member only</span>
                  )}
                  {(() => {
                    const target = buyTarget(product);
                    const image = (
                      <img
                        src={optimizeImage(
                          product.images?.[0] || product.image,
                          500
                        )}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.src = fallbackImage;
                        }}
                      />
                    );
                    return target ? (
                      <a
                        href={target}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {image}
                      </a>
                    ) : (
                      <Link to={`/product/${product.id}`}>{image}</Link>
                    );
                  })()}
                  {d > 0 && (
                    <span className="tryout-offer-discount">{d}% OFF</span>
                  )}
                </div>

                <div className="tryout-offer-body">
                  <p className="tryout-brand">{product.brand}</p>
                  <h3>
                    {(() => {
                      const target = buyTarget(product);
                      return target ? (
                        <a
                          href={target}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {product.name}
                        </a>
                      ) : (
                        <Link to={`/product/${product.id}`}>
                          {product.name}
                        </Link>
                      );
                    })()}
                  </h3>

                  <div className="tryout-poster-rating">
                    ★ <b>{product.rating}</b> ({product.reviews})
                  </div>

                  <div className="tryout-poster-features tryout-offer-features">
                    <span className="tryout-poster-feature">✅ 100% Original</span>
                    <span className="tryout-poster-feature">💸 Member Price</span>
                    <span className="tryout-poster-feature">🚚 Fast Delivery</span>
                    <span className="tryout-poster-feature">🔄 Easy Returns</span>
                  </div>

                  <div className="tryout-offer-price-row">
                    <div className="tryout-price">
                      <strong>₹{product.price}</strong>
                      {product.originalPrice > product.price && (
                        <del>₹{product.originalPrice}</del>
                      )}
                      {d > 0 && (
                        <span className="tryout-discount">{d}% off</span>
                      )}
                    </div>
                  </div>

                  {tryoutApproved ? (
                    <>
                      {(() => {
                        const target = buyTarget(product);
                        const label =
                          product.buyLinkLabel?.trim() || "Buy Now";
                        if (target) {
                          return (
                            <>
                              <a
                                href={target}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tryout-buy-btn tryout-buy-link"
                              >
                                🛒 {label}
                              </a>
                              {product.buyLinkTerms?.trim() && (
                                <small className="tryout-offer-terms">
                                  ⚠️ {product.buyLinkTerms.trim()}
                                </small>
                              )}
                              <Link
                                to={`/product/${product.id}`}
                                className="tryout-offer-view"
                              >
                                View full details →
                              </Link>
                            </>
                          );
                        }
                        return (
                          <>
                            <button
                              type="button"
                              className="tryout-buy-btn"
                              disabled={product.stock <= 0}
                              onClick={() => addToCart(product)}
                            >
                              {product.stock <= 0
                                ? "Out of Stock"
                                : "🛒 Buy now — Member price"}
                            </button>
                            <Link
                              to={`/product/${product.id}`}
                              className="tryout-offer-view"
                            >
                              View full details →
                            </Link>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="tryout-buy-btn tryout-buy-locked"
                      onClick={() =>
                        navigate("/tryouts")
                      }
                    >
                      🔒 Apply for Tryout member
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="tryout-dash-help">
        <Link to="/tryouts">← Back to Tryouts</Link>
      </div>
    </main>
  );
}
