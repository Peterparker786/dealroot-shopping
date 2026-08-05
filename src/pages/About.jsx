import {
  FaCheckCircle,
  FaTag,
  FaTruck,
  FaUndo,
  FaShieldAlt,
  FaEnvelope,
  FaTelegramPlane,
  FaMapMarkerAlt,
  FaQuoteLeft,
} from "react-icons/fa";
import "./About.css";

const guarantees = [
  {
    icon: <FaCheckCircle />,
    title: "100% Authentic & Original Products",
    text: "We work directly with authorized brands and genuine suppliers. There is no place here for fake or duplicate products.",
  },
  {
    icon: <FaTag />,
    title: "Unbeatable Prices",
    text: "We bring you discounts of up to 50% on the best beauty products along with exclusive flash sales, so you can look your best while staying within budget.",
  },
  {
    icon: <FaTruck />,
    title: "Fast & Safe Delivery",
    text: "Your favourite product reaches your doorstep on time, without any hassle.",
  },
  {
    icon: <FaUndo />,
    title: "7-Day Easy Returns",
    text: "If for any reason you don't like a product, our 7-day return policy is always ready for you.",
  },
  {
    icon: <FaShieldAlt />,
    title: "100% Secure Payments",
    text: "UPI, Credit/Debit cards, and Cash on Delivery (COD) — every payment option is fully safe and reliable.",
  },
];

export default function About() {
  return (
    <section className="about-page">
      {/* HERO */}
      <div className="about-hero">
        <span className="about-eyebrow">ABOUT DEALROOT</span>
        <h1>
          About Us — <span>DealRoot Beauty</span>
        </h1>
        <p className="about-tagline">Glow More. Spend Less.</p>
        <p className="about-hero-sub">
          Welcome to DealRoot Beauty! We believe everyone deserves
          premium-quality skincare, makeup and haircare products — at
          pocket-friendly prices.
        </p>
      </div>

      <div className="about-body">
        {/* MISSION */}
        <div className="about-card about-mission">
          <span className="about-icon-circle">
            <FaQuoteLeft />
          </span>
          <h2>Our Mission</h2>
          <p>
            Our mission is simple: to bring the best beauty and personal
            care brands to you in an easy and affordable way.
          </p>
        </div>

        {/* GUARANTEES */}
        <div className="about-section-head">
          <h2>Our Guarantees (Why Choose Us?)</h2>
          <p>Why thousands of beauty lovers trust DealRoot every day.</p>
        </div>

        <div className="about-guarantee-grid">
          {guarantees.map((guarantee) => (
            <div className="about-guarantee" key={guarantee.title}>
              <span>{guarantee.icon}</span>
              <h3>{guarantee.title}</h3>
              <p>{guarantee.text}</p>
            </div>
          ))}
        </div>

        {/* STORY */}
        <div className="about-card about-story">
          <h2>Our Story</h2>
          <p>
            DealRoot Beauty began in Kanpur with one simple thought:
            beauty care should be premium, but its prices shouldn't be.
          </p>
          <p>
            From skincare essentials to trendy makeup products, we've
            brought every brand that can transform your daily beauty
            routine onto a single platform. Whether it's your skin type
            or your beauty goals, DealRoot has a solution for every need.
          </p>
        </div>

        {/* GET IN TOUCH */}
        <div className="about-card about-contact">
          <h2>Get In Touch</h2>
          <p>
            Your feedback and questions matter a lot to us. Reach out to
            us for any help or query:
          </p>

          <div className="about-contact-row">
            <a className="about-contact-item" href="mailto:dealroot.store@gmail.com">
              <span className="about-contact-icon">
                <FaEnvelope />
              </span>
              <div>
                <small>Email</small>
                <b>dealroot.store@gmail.com</b>
              </div>
            </a>

            <a
              className="about-contact-item"
              href="https://t.me/Tom_andrew72"
              target="_blank"
              rel="noreferrer"
            >
              <span className="about-contact-icon telegram">
                <FaTelegramPlane />
              </span>
              <div>
                <small>Telegram</small>
                <b>@Tom_andrew72</b>
              </div>
            </a>

            <div className="about-contact-item">
              <span className="about-contact-icon location">
                <FaMapMarkerAlt />
              </span>
              <div>
                <small>Location</small>
                <b>Kanpur, Uttar Pradesh, India</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
