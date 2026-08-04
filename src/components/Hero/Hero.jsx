import "./Hero.css";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiRefreshCw,
  FiTruck,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useCallback, useEffect, useRef, useState } from "react";

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
        loading="eager"
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

export default function Hero({ banners, banner, fallbackImage }) {
  // Accept both the new array prop and the legacy single-banner prop.
  const bannerList = Array.isArray(banners)
    ? banners.filter((b) => b && (b.image || b.bannerImage || b.url))
    : [];

  const legacyBanner =
    banner && (banner.image || banner.bannerImage || banner.url)
      ? [banner]
      : [];

  const slides = bannerList.length > 0 ? bannerList : legacyBanner;

  const single =
    slides.length === 0
      ? { image: fallbackImage, link: "" }
      : slides[0];

  const hasCarousel = slides.length > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const goTo = useCallback((next) => {
    setIndex(() => (next + slides.length) % slides.length);
  }, [slides.length]);

  const nextSlide = useCallback(() => goTo(index + 1), [goTo, index]);
  const prevSlide = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-advance the carousel every 5 seconds unless paused/hovered.
  useEffect(() => {
    if (!hasCarousel || paused) return undefined;

    const timer = window.setInterval(nextSlide, 5000);
    return () => window.clearInterval(timer);
  }, [hasCarousel, paused, nextSlide, index]);

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    setPaused(true);
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    // Resume auto-advance shortly after the swipe ends.
    window.setTimeout(() => setPaused(false), 3000);

    if (Math.abs(delta) > 50) {
      if (delta < 0) nextSlide();
      else prevSlide();
    }
  };

  // Guard against a stale index if the banner list shrinks (e.g. admin
  // deletes a banner while this page is open).
  const safeIndex = hasCarousel
    ? Math.min(index, slides.length - 1)
    : 0;

  const renderSlide = (item) => (
    <BannerShowcase
      heroImage={item.image || item.bannerImage || item.url}
      link={(item.buttonLink || "").trim()}
    />
  );

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
        <div
          className={`hero-carousel ${hasCarousel ? "hero-carousel-multi" : ""}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={hasCarousel ? onTouchStart : undefined}
          onTouchEnd={hasCarousel ? onTouchEnd : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={hasCarousel ? safeIndex : "single"}
              className="hero-carousel-slide"
              initial={{ opacity: 0, x: hasCarousel ? 40 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: hasCarousel ? -40 : 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {hasCarousel ? renderSlide(slides[safeIndex]) : renderSlide(single)}
            </motion.div>
          </AnimatePresence>

          {hasCarousel && (
            <>
              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-prev"
                onClick={prevSlide}
                aria-label="Previous banner"
              >
                <FiChevronLeft size={22} />
              </button>

              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-next"
                onClick={nextSlide}
                aria-label="Next banner"
              >
                <FiChevronRight size={22} />
              </button>

              <div className="hero-carousel-dots">
                {slides.map((item, dotIndex) => (
                  <button
                    type="button"
                    key={dotIndex}
                    className={`hero-carousel-dot ${
                      dotIndex === safeIndex ? "active" : ""
                    }`}
                    onClick={() => goTo(dotIndex)}
                    aria-label={`Go to banner ${dotIndex + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
