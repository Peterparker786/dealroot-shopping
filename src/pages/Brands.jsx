import {
  FaStar,
  FaTag,
  FaTruck,
  FaUndo,
  FaCheckCircle,
  FaChevronRight,
} from "react-icons/fa";
import "./Brands.css";

const featuredBrands = [
  { name: "Estée Lauder", text: "High-end skincare and iconic beauty essentials." },
  { name: "Clinique", text: "Dermatologist-tested premium skincare & gentle makeup." },
  { name: "MAC Cosmetics", text: "Professional-grade makeup and trendsetting shades." },
  { name: "Forest Essentials", text: "Traditional Luxury Ayurveda for face, body, and hair care." },
  { name: "Kama Ayurveda", text: "Pure, authentic, and high-performance Ayurvedic beauty formulas." },
  { name: "Laneige", text: "Premium Korean hydration and iconic lip care essentials." },
  { name: "Huda Beauty", text: "Trendy, highly-pigmented cosmetics and glam makeup." },
  { name: "The Body Shop", text: "Cruelty-free, nature-inspired body care and skincare." },
];

const massBrands = [
  { name: "Plum Goodness", text: "100% vegan skincare, body care, and hair care." },
  { name: "Brillare", text: "Natural hair-growth essentials & rosemary oil treatments." },
  { name: "Dot & Key", text: "Trendy, high-performance skincare for glowing skin." },
  { name: "Mamaearth", text: "Toxin-free natural makeup & family skin essentials." },
  { name: "Minimalist", text: "Science-backed, active-ingredient skincare." },
  { name: "The Derma Co", text: "Dermatologist-designed solutions for active acne & dark spots." },
  { name: "Nivea", text: "Trusted daily moisturizing and body care essentials." },
  { name: "L'Oréal Paris", text: "World-class hair care, hair color, and skincare." },
  { name: "Lakmé", text: "India's favorite daily and bridal makeup range." },
  { name: "Maybelline New York", text: "High-street, long-lasting makeup essentials." },
  { name: "Biotique", text: "Affordable botanical and Ayurvedic beauty formulas." },
  { name: "Silver Dip", text: "Premium cleaning and silver care solutions." },
];

const brandIndex = [
  {
    letter: "B",
    brands: ["Beardo", "Biotique", "Brillare", "Bodywise"],
  },
  { letter: "C", brands: ["Cetaphil", "Clinique"] },
  { letter: "D", brands: ["Derma Co", "Dot & Key"] },
  {
    letter: "E",
    brands: ["Estée Lauder"],
  },
  { letter: "F", brands: ["Faces Canada", "Forest Essentials"] },
  { letter: "H", brands: ["Himalayan Organics", "Huda Beauty"] },
  { letter: "I", brands: ["Innisfree"] },
  { letter: "K", brands: ["Kama Ayurveda"] },
  { letter: "L", brands: ["L'Oréal Paris", "Lakmé", "Laneige"] },
  {
    letter: "M",
    brands: ["MAC Cosmetics", "Mamaearth", "Maybelline New York", "Minimalist"],
  },
  { letter: "N", brands: ["Nivea", "NYX Professional Makeup"] },
  { letter: "O", brands: ["Olay"] },
  { letter: "P", brands: ["Plum Goodness"] },
  { letter: "S", brands: ["Silver Dip", "Simple Skincare", "Sugar Cosmetics"] },
  { letter: "T", brands: ["The Body Shop", "Tresemme"] },
  { letter: "W", brands: ["WOW Skin Science"] },
];

const benefits = [
  {
    icon: <FaCheckCircle />,
    title: "100% Authentic Products",
    text: "Sourced directly from authorized suppliers and brand partners.",
  },
  {
    icon: <FaTag />,
    title: "Unbeatable Discounts",
    text: "Daily flash sales and exclusive combo deals.",
  },
  {
    icon: <FaTruck />,
    title: "Fast & Safe Delivery",
    text: "Quick delivery to your doorstep with safe packaging.",
  },
  {
    icon: <FaUndo />,
    title: "Easy 7-Day Returns",
    text: "Hassle-free return policy for your complete trust.",
  },
];

export default function Brands() {
  return (
    <section className="brands-page">
      {/* HERO */}
      <div className="brands-hero">
        <span className="brands-eyebrow">OUR PARTNER BRANDS</span>
        <h1>
          Brands We <span>Love</span>
        </h1>
        <p className="brands-hero-sub">
          At DealRoot Beauty you get 100% original and authentic beauty
          products from <b>30+ top-rated</b>, luxury and affordable
          brands — at unbeatable prices!
        </p>
        <div className="brands-count">
          <FaStar /> 30+ Brands &amp; Growing
        </div>
      </div>

      <div className="brands-body">
        {/* FEATURED & LUXURY */}
        <div className="brands-section-head">
          <h2>✨ Featured &amp; Luxury Brands</h2>
        </div>

        <div className="brands-featured-grid">
          {featuredBrands.map((brand) => (
            <div className="brands-featured-card" key={brand.name}>
              <span className="brands-featured-icon">
                {brand.name.charAt(0)}
              </span>
              <div>
                <h3>{brand.name}</h3>
                <p>{brand.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MASS & DAILY ESSENTIALS */}
        <div className="brands-section-head">
          <h2>🔥 Mass &amp; Daily Essentials (Up to 50% OFF)</h2>
        </div>

        <div className="brands-mass-grid">
          {massBrands.map((brand) => (
            <div className="brands-mass-card" key={brand.name}>
              <span className="brands-mass-icon">
                {brand.name.charAt(0)}
              </span>
              <div>
                <h3>{brand.name}</h3>
                <p>{brand.text}</p>
              </div>
              <FaChevronRight className="brands-mass-arrow" />
            </div>
          ))}
        </div>

        {/* A TO Z INDEX */}
        <div className="brands-section-head">
          <h2>All Brands (A to Z Index)</h2>
        </div>

        <div className="brands-index">
          {brandIndex.map((group) => (
            <div className="brands-index-group" key={group.letter}>
              <span className="brands-index-letter">{group.letter}</span>
              <div className="brands-index-list">
                {group.brands.map((brand) => (
                  <span className="brands-index-pill" key={brand}>
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* WHY SHOP */}
        <div className="brands-section-head">
          <h2>Why Shop Brands on DealRoot?</h2>
        </div>

        <div className="brands-benefit-grid">
          {benefits.map((benefit) => (
            <div className="brands-benefit" key={benefit.title}>
              <span>{benefit.icon}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
