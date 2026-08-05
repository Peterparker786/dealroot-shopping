import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">DealRoot</div>
          <span className="footer-logo-sub">BEAUTY</span>
          <p>Your trusted beauty destination. Curated skincare, makeup and fragrances from the world's best brands.</p>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><a href="/#categories">Categories</a></li>
            <li><a href="/#products">All Products</a></li>
            <li><a href="/#price-deals">Today's Deals</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Help</h4>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/shipping">Shipping Info</Link></li>
            <li><Link to="/refund">Returns</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:dealoot.store@gmail.com">dealoot.store@gmail.com</a></li>
            <li><a href="https://t.me/Tom_andrew72" target="_blank" rel="noreferrer">@Tom_andrew72</a></li>
            <li>📍 Kanpur, Uttar Pradesh</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>More</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/brands">Brands</Link></li>
            <li><Link to="/become-a-seller">Become a Seller</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DealRoot Beauty. All rights reserved.</p>
      </div>
    </footer>
  );
}