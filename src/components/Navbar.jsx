import "../styles/navbar.css";
import logo from "../assets/Logo.png";
import { Link } from "react-router-dom";
import { FiSearch, FiUser, FiHeart, FiShoppingBag, FiSettings } from "react-icons/fi";

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
        <p>Complimentary delivery on orders above ₹499</p>
        <p>Authentic beauty · Curated with care</p>
      </div>

      <header className="navbar">
        <Link to="/" className="brand">
          <img
            src={logo}
            alt="Dealroot"
            className="brand-logo"
          />
        </Link>
<nav className="nav-links">

  <a href="#top">Home</a>

  <a href="#categories">Categories</a>

  <a href="#products">Shop</a>

  <a href="#price-deals">Offers</a>

  <a href="#footer">Contact</a>

</nav>

        <label className="search-box">

  <FiSearch className="search-icon"/>

  <input
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
    placeholder="Search 5000+ Beauty Products..."
  />

</label>

        <nav className="nav-actions">
          <button type="button" onClick={openAdmin} className="nav-action-btn">
            <FiSettings aria-hidden="true" />
            <b>Admin</b>
          </button>

          <button
            type="button"
            className="nav-action-btn"
            onClick={() => setAccountOpen(true)}
          >
            <FiUser aria-hidden="true" />
            <b>{user ? user.name.split(" ")[0] : "Account"}</b>
          </button>

          <button
            type="button"
            className="nav-action-btn"
            onClick={() => showToast("Wishlist feature is coming next")}
          >
            <FiHeart aria-hidden="true" />
            <b>Wishlist</b>
            {wishlist.length > 0 && <em>{wishlist.length}</em>}
          </button>

          <button
            type="button"
            className="nav-action-btn cart-button"
            onClick={() => setCartOpen(true)}
          >
            <FiShoppingBag aria-hidden="true" />
            <b>Bag</b>
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>
        </nav>
      </header>
    </>
  );
}
