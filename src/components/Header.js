import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-left">
        <div className="logo-container">
          <div className="logo-circle">
            <span className="logo-text">BIOCS</span>
          </div>
        </div>
        <h1 className="header-title">Biosequence Analyzer</h1>
      </Link>
      <div className="header-right">
        <Link to="/about" className="login-btn">About</Link>
      </div>
    </header>
  );
}

export default Header;
