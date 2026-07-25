import {
  FaTelegramPlane,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";

export default function Contact() {
  return (
    <section
        id="contact"
      style={{
        padding: "70px 8%",
        background: "#f7f8fc",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "50px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            color: "#1b2a4e",
            marginBottom: "10px",
          }}
        >
          Contact Us
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
          }}
        >
          We'd love to hear from you. Feel free to reach out anytime.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "35px",
        }}
      >
        {/* LEFT */}

        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            boxShadow: "0 8px 25px rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              marginBottom: "25px",
            }}
          >
            Get in Touch
          </h2>

          <p style={{ marginBottom: "22px" }}>
            <FaTelegramPlane color="#229ED9" size={20} />{" "}
            <a
              href="https://t.me/Tom_andrew72"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: "#229ED9",
                fontWeight: "600",
              }}
            >
              @Tom_andrew72
            </a>
          </p>

          <p style={{ marginBottom: "22px" }}>
            <FaEnvelope color="#555" size={18} /> hm952412@gmail.com
          </p>

          <p style={{ marginBottom: "22px" }}>
            <FaMapMarkerAlt color="#555" size={18} /> Delhi, India
          </p>

          <p>
            <FaClock color="#555" size={18} /> Monday – Saturday
            <br />
            10:00 AM – 7:00 PM
          </p>
        </div>

        {/* RIGHT */}

        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            boxShadow: "0 8px 25px rgba(0,0,0,.08)",
          }}
        >
          <h2
            style={{
              marginBottom: "25px",
            }}
          >
            Send us a Message
          </h2>

          <input
            placeholder="Your Name"
            style={inputStyle}
          />

          <input
            placeholder="Your Email"
            style={inputStyle}
          />

          <input
            placeholder="Subject"
            style={inputStyle}
          />

          <textarea
            rows="5"
            placeholder="Write your message..."
            style={inputStyle}
          ></textarea>

          <button
            style={{
              width: "100%",
              background: "#2b6fff",
              color: "#fff",
              border: "none",
              padding: "15px",
              borderRadius: "10px",
              fontSize: "17px",
              cursor: "pointer",
            }}
          >
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "18px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "15px",
  outline: "none",
};