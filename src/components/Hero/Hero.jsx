import "./Hero.css";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero({ banner, fallbackImage }) {
  const heroImage =
    banner?.image ||
    banner?.bannerImage ||
    banner?.url ||
    fallbackImage;

  return (
    <section className="hero">
      <div className="hero-left">
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-tag"
        >
          <Sparkles size={16} />
          Premium Beauty Collection
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .1 }}
        >
          Discover Beauty <br />
          <span>Beyond Imagination</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .2 }}
        >
          Luxury skincare, makeup and fragrances from the world's
          best brands. Curated for modern beauty lovers.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .35 }}
        >
          <button
  className="primary-btn"
  onClick={() =>
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" })
  }
>
  Shop Now
  <ArrowRight size={18} />
</button>

          <button className="secondary-btn">
            Explore Collection
          </button>
        </motion.div>
      </div>

      <motion.div
        className="hero-right"
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .6 }}
      >
        <div className="hero-image-wrapper">

  <div className="floating-card rating-card">
    ⭐ 4.9 Rating
  </div>

  <div className="floating-card delivery-card">
    🚚 Free Delivery
  </div>

  <div className="floating-card offer-card">
    🔥 Up to 50% OFF
  </div>

  <img
    src={heroImage}
    alt="Hero Banner"
  />

</div>
      </motion.div>
    </section>
  );
}