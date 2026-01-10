import React from 'react';
import { Link } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header__logo">FoodFind</div>
      <nav className="header__nav">
        <Link to="/" className="nav__link">Home</Link>
        <Link to="/explore" className="nav__link">Explore</Link>
        <Link to="/offers" className="nav__link">Offers</Link>
        <Link to="/about" className="nav__link">About Us</Link>
      </nav>
      <div className="header__actions">
        <button className="btn btn--outline">Log In</button>
        <button className="btn btn--primary">Sign Up</button>
        <div className="user-avatar">
          <FiUser size={24} />
        </div>
      </div>
    </header>
  );
};

export default Header;
