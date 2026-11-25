import { Link } from "react-router-dom";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

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
            <li><a href="mailto:dealroot.store@gmail.com">dealroot.store@gmail.com</a></li>
            <li><a href="https://t.me/Tom_andrew72" target="_blank" rel="noreferrer">@Tom_andrew72</a></li>
            <li>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Kanpur,+Uttar+Pradesh,+India"
                target="_blank"
                rel="noreferrer"
                className="footer-map-link"
              >
                📍 Kanpur, Uttar Pradesh
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Follow Us</h4>
          <ul>
            <li>
              <a
                href="https://www.instagram.com/dealroot.store"
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
              >
                <FaInstagram className="footer-social-icon instagram-icon" />
                @dealroot.store
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/profile.php?id=61592758863958"
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
              >
                <FaFacebookF className="footer-social-icon facebook-icon" />
                DealRoot Beauty
              </a>
            </li>
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