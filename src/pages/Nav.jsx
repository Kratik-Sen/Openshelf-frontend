import React, { useState } from "react";
import { Link } from "react-router-dom"; // ✅ Import Link
import "./Navbar.css";

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const authed = Boolean(localStorage.getItem("token"));
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="hamburger" onClick={toggleMenu}>
          ☰
        </div>
        <div className={`nav-links ${isOpen ? "show" : ""}`}>
          <div className="nav-left">
            <Link to="/" className="logo-link">
              <img className="nav-logo" src="/logo.png" alt="OpenShelf logo" />
              <p className="logo-text">OpenShelf</p>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/admin">Add Book</Link>
            {authed && <Link to="/my-library">My Library</Link>}
            {!authed && <Link to="/login">Login</Link>}
            {!authed && <Link to="/signup">Signup</Link>}
            {authed && (
              <>
                <span className="user-name">{user?.name || "User"}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
