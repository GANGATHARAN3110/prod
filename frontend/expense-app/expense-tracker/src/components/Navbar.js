import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Home, Users, Wallet, UserCircle, Settings, LogIn, UserPlus } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">💰 Expense Tracker</Link>

        <nav className="navbar-links">
          <NavLink to="/" className="nav-item" end>
            <Home size={18} /> Home
          </NavLink>
          <NavLink to="/groups" className="nav-item">
            <Users size={18} /> Groups
          </NavLink>
          <NavLink to="/expenses" className="nav-item">
            <Wallet size={18} /> Expenses
          </NavLink>
          <NavLink to="/members" className="nav-item">
            <UserCircle size={18} /> Members
          </NavLink>
          <NavLink to="/settings" className="nav-item">
            <Settings size={18} /> Settings
          </NavLink>
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="btn btn-login">
            <LogIn size={16} /> Login
          </Link>
          <Link to="/register" className="btn btn-register">
            <UserPlus size={16} /> Register
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
