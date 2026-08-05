import {
  FaTelegramPlane,
  FaEnvelope,
  FaStore,
  FaUsers,
  FaTruck,
  FaHeadset,
  FaChevronRight,
} from "react-icons/fa";
import "./BecomeSeller.css";

export default function BecomeSeller() {
  return (
    <section className="seller-page">
      {/* HERO */}
      <div className="seller-hero">
        <span className="seller-eyebrow">SELL ON DEALROOT</span>
        <h1>
          Become a <span>Seller</span>
        </h1>
        <p className="seller-hero-sub">
          Grow your beauty business with India's most-loved premium
          beauty destination.
        </p>

        <div className="seller-stat-row">
          <div className="seller-stat">
            <b>10K+</b>
            <small>Happy Customers</small>
          </div>
          <div className="seller-stat">
            <b>100%</b>
            <small>Original Products</small>
          </div>
          <div className="seller-stat">
            <b>7 Days</b>
            <small>Easy Returns</small>
          </div>
        </div>
      </div>

      {/* MAIN MESSAGE */}
      <div className="seller-body">
        <div className="seller-card seller-intro">
          <span className="seller-icon-circle">
            <FaStore />
          </span>
          <h2>Contact Us To Become a Seller</h2>
          <p className="seller-intro-text">
            At DEALROOT, we believe every great brand deserves a stage.
            Whether you are a home-grown beauty startup, an established
            skincare or makeup brand, or a wholesale distributor looking
            to reach thousands of beauty lovers across India — we would
            love to have you on board.
          </p>
          <p className="seller-intro-text">
            Selling with us is simple and completely risk-free. We handle
            the entire journey for you: from listing your products with
            beautiful imagery and honest descriptions, to managing orders,
            secure payments, and even delivery. You focus on making
            amazing products — we take care of everything else, so you
            can watch your brand grow with every single sale.
          </p>
          <p className="seller-intro-text">
            There is no hidden fee, no complicated paperwork, and no long
            waiting period. Share your catalogue with us today, and our
            team will get back to you within 24 hours with your very own
            seller dashboard, transparent pricing, and a dedicated
            support manager who will personally help you set up, launch,
            and scale your products on DEALROOT.
          </p>
        </div>

        {/* BENEFITS */}
        <div className="seller-grid">
          <div className="seller-benefit">
            <span>
              <FaUsers />
            </span>
            <h3>Reach Thousands of Buyers</h3>
            <p>
              Your products instantly get exposure to our growing
              community of beauty shoppers across India.
            </p>
          </div>

          <div className="seller-benefit">
            <span>
              <FaTruck />
            </span>
            <h3>We Handle Shipping</h3>
            <p>
              No logistics headache. Orders are packed and delivered by
              us, with live tracking for every shipment.
            </p>
          </div>

          <div className="seller-benefit">
            <span>
              <FaHeadset />
            </span>
            <h3>Dedicated Support</h3>
            <p>
              A personal seller manager helps you list, launch and scale
              — every step of the way.
            </p>
          </div>
        </div>

        {/* CONTACT CARDS */}
        <div className="seller-contact-head">
          <h2>Get Started Today</h2>
          <p>
            Reach out on any of the channels below and our team will
            respond within 24 hours.
          </p>
        </div>

        <div className="seller-contact-row">
          <a
            className="seller-contact-card"
            href="mailto:dealroot.store@gmail.com"
          >
            <span className="seller-contact-icon">
              <FaEnvelope />
            </span>
            <div>
              <small>Email Us</small>
              <b>dealroot.store@gmail.com</b>
            </div>
            <FaChevronRight className="seller-contact-arrow" />
          </a>

          <a
            className="seller-contact-card"
            href="https://t.me/Tom_andrew72"
            target="_blank"
            rel="noreferrer"
          >
            <span className="seller-contact-icon telegram">
              <FaTelegramPlane />
            </span>
            <div>
              <small>Message on Telegram</small>
              <b>@Tom_andrew72</b>
            </div>
            <FaChevronRight className="seller-contact-arrow" />
          </a>
        </div>

        <p className="seller-note">
          📧 Email us or message us on Telegram — mention "Seller
          Enquiry" with your brand name and product list, and we will
          take it from there.
        </p>
      </div>
    </section>
  );
}
