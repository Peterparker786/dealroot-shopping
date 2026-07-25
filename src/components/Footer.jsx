import { Link } from "react-router-dom";
import {
  FaTelegramPlane,
  FaEnvelope,
  FaShieldAlt,
  FaCreditCard,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#111827",
        color: "#fff",
        padding: "50px 8% 20px",
        marginTop: "60px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: "30px",
        }}
      >
        {/* Brand */}
        <div>
          <h2 style={{ marginBottom: 15 }}>DEALROOT</h2>
          <p style={{ color: "#ccc", lineHeight: 1.7 }}>
            Discover the best beauty, skincare and makeup deals from trusted
            brands at affordable prices.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ marginBottom: 15 }}>Quick Links</h3>

          <p><Link style={linkStyle} to="/">Home</Link></p>
          <p><a style={linkStyle} href="/#products">Products</a></p>
          <p><Link style={linkStyle} to="/contact">Contact Us</Link></p>
        </div>

        {/* Policies */}
        <div>
          <h3 style={{ marginBottom: 15 }}>Policies</h3>

          <p><Link style={linkStyle} to="/privacy">Privacy Policy</Link></p>
          <p><Link style={linkStyle} to="/terms">Terms & Conditions</Link></p>
          <p><Link style={linkStyle} to="/shipping">Shipping Policy</Link></p>
          <p><Link style={linkStyle} to="/refund">Refund Policy</Link></p>
        </div>

        {/* Contact */}
        <div>
          <h3 style={{ marginBottom: 15 }}>Contact</h3>

          <p>
            <FaEnvelope />{" "}
            <a
              href="mailto:hm952142@gmail.com"
              style={linkStyle}
            >
              hm952142@gmail.com
            </a>
          </p>

          <p>
            <FaTelegramPlane />{" "}
            <a
              href="https://t.me/Tom_andrew72"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              @Tom_andrew72
            </a>
          </p>

          <p style={{ marginTop: 15 }}>
            <FaShieldAlt /> Secure Shopping
          </p>

          <p>
            <FaCreditCard /> Safe Payments
          </p>
        </div>
      </div>

      <hr
        style={{
          margin: "35px 0 20px",
          border: 0,
          borderTop: "1px solid #2f3545",
        }}
      />

      <div
        style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "14px",
        }}
      >
        © {new Date().getFullYear()} Dealroot. All Rights Reserved.
      </div>
    </footer>
  );
}

const linkStyle = {
  color: "#ddd",
  textDecoration: "none",
  lineHeight: "2",
};