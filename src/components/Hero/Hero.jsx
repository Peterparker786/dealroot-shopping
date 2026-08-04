import "./Hero.css";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck, FiRefreshCw, FiTruck, FiShield } from "react-icons/fi";

function BannerShowcase({ heroImage, link }) {
  const scrollToProducts = (event) => {
    event.preventDefault();
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const showcase = (
    <>
      <div className="hero-offer-badge">
        UP TO <strong>50%</strong> OFF
      </div>
      <img
        src={heroImage}
        alt="Offer banner"
        className="hero-product-img"
      />
      <span className="banner-click-hint">Click to Shop →</span>
    </>
  );

  // Empty link, or a link to the products section, scrolls to products.
  // ("/products" is not a route — old banners used it as a default.)
  const isProductsLink =
    !link ||
    link === "/products" ||
    link === "/#products" ||
    link === "#products";

  if (isProductsLink) {
    return (
      <button
        type="button"
        className="hero-product-showcase banner-clickable"
        onClick={scrollToProducts}
        aria-label="Shop the offer"
      >
        {showcase}
      </button>
    );
  }

  if (link.startsWith("http")) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="hero-product-showcase banner-clickable"
        aria-label="Shop the offer"
      >
        {showcase}
      </a>
    );
  }

  if (link.startsWith("/")) {
    return (
      <Link
        to={link}
        className="hero-product-showcase banner-clickable"
        aria-label="Shop the offer"
      >
        {showcase}
      </Link>
    );
  }

  return (
    <a
      href={link}
      className="hero-product-showcase banner-clickable"
      aria-label="Shop the offer"
    >
      {showcase}
    </a>
  );
}

export default function Hero({ banner, fallbackImage }) {
  const heroImage =
    banner?.image ||
    banner?.bannerImage ||
    banner?.url ||
    fallbackImage;

  const link = (banner?.buttonLink || "").trim();

  return (
    <section className="hero-banner">
      <div className="hero-left">
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-tag"
        >
          ☀️ SUMMER BEAUTY SALE
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Glow more. <br />
          <span>Spend less.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Up to 50% OFF on bestsellers, skincare, makeup & more. Curated for modern beauty lovers.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <button
            className="hero-btn-primary"
            onClick={() =>
              document
                .getElementById("products")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Shop Now <FiArrowRight size={18} />
          </button>

          <button
            className="hero-btn-secondary"
            onClick={() =>
              document
                .getElementById("categories")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore Offers
          </button>
        </motion.div>

        <motion.div
          className="hero-features"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="hero-feature"><FiCheck size={14} /> 100% Original</div>
          <div className="hero-feature"><FiRefreshCw size={14} /> Easy Returns</div>
          <div className="hero-feature"><FiTruck size={14} /> Fast Delivery</div>
          <div className="hero-feature"><FiShield size={14} /> Secure Payments</div>
        </motion.div>
      </div>

      <motion.div
        className="hero-right"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <BannerShowcase heroImage={heroImage} link={link} />
      </motion.div>
    </section>
  );
}
