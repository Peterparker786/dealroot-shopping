import { Link } from "react-router-dom";
import {
  FaTelegramPlane,
  FaEnvelope,
  FaShieldAlt,
  FaCreditCard,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-grid">
        <div className="footer-brand-block">
          <h2 className="footer-logo">DEALROOT</h2>
          <p className="footer-tagline">
            Curated beauty essentials — skincare, makeup and fragrance from
            trusted brands, delivered with care.
          </p>
        </div>

        <div className="footer-links-block">
          <h3>Explore</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><a href="/#products">Collection</a></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-links-block">
          <h3>Policies</h3>
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/shipping">Shipping Policy</Link></li>
            <li><Link to="/refund">Refund Policy</Link></li>
          </ul>
        </div>

        <div className="footer-links-block">
          <h3>Connect</h3>
          <ul className="footer-contact-list">
            <li>
              <FaEnvelope aria-hidden="true" />
              <a href="mailto:hm952142@gmail.com">hm952142@gmail.com</a>
            </li>
            <li>
              <FaTelegramPlane aria-hidden="true" />
              <a
                href="https://t.me/Tom_andrew72"
                target="_blank"
                rel="noreferrer"
              >
                @Tom_andrew72
              </a>
            </li>
            <li className="footer-trust">
              <FaShieldAlt aria-hidden="true" /> Secure Shopping
            </li>
            <li className="footer-trust">
              <FaCreditCard aria-hidden="true" /> Safe Payments
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Dealroot. All rights reserved.</p>
      </div>
    </footer>
  );
}
