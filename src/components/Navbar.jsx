import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

export default function Navbar({
  search,
  setSearch,
  openAdmin,
  user,
  wishlist,
  cartCount,
  setAccountOpen,
  setCartOpen,
  showToast,
}) {
  return (
    <>
      <div className="top-strip">
        <p>Free delivery on orders above ₹499</p>
        <p>100% genuine beauty products</p>
      </div>

      <header className="navbar">
<Link to="/" className="brand">
  <img
    src={logo}
    alt="Dealroot"
    style={{
      height: "55px",
      width: "150px",
    }}
  />
</Link>

        <label className="search-box">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search beauty, skincare, makeup..."
          />
        </label>

        <nav className="nav-actions">
          <button onClick={openAdmin}>
            <span>⚙</span>
            <b>Admin</b>
          </button>

          <button onClick={() => setAccountOpen(true)}>
            <span>👤</span>
            <b>{user ? user.name.split(" ")[0] : "Account"}</b>
          </button>

          <button onClick={() => showToast("Wishlist feature is coming next")}>
            <span>♡</span>
            <b>Wishlist</b>
            {wishlist.length > 0 && <em>{wishlist.length}</em>}
          </button>

          <button className="cart-button" onClick={() => setCartOpen(true)}>
            <span>🛒</span>
            <b>Cart</b>
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>
        </nav>
      </header>
    </>
  );
}