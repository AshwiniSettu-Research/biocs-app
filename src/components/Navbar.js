import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path === '/service' && location.pathname.startsWith('/service')) return true;
    if (path === '/about' && location.pathname === '/about') return true;
    return false;
  };

  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <Link to="/">Home</Link>
        </li>
        <li
          className={`nav-item has-dropdown ${isActive('/service') ? 'active' : ''}`}
          onMouseEnter={() => setShowServiceDropdown(true)}
          onMouseLeave={() => setShowServiceDropdown(false)}
        >
          <a href="#service" onClick={(e) => e.preventDefault()}>Service</a>
          {showServiceDropdown && (
            <div className="dropdown-menu">
              <Link
                to="/service/protein-alignment"
                className="dropdown-item"
                onClick={() => setShowServiceDropdown(false)}
              >
                Protein Sequence Analyser
              </Link>
              <Link
                to="/service/antigenic-peptide"
                className="dropdown-item"
                onClick={() => setShowServiceDropdown(false)}
              >
                Antigenic Peptide Predictor
              </Link>
            </div>
          )}
        </li>
        <li className="nav-item">
          <a href="https://www.uniprot.org" target="_blank" rel="noopener noreferrer">Documents</a>
        </li>
        <li className="nav-item">
          <a href="https://scholar.google.com/citations?user=qVLxihUAAAAJ&hl=en&authuser=2" target="_blank" rel="noopener noreferrer">Research</a>
        </li>
        <li className="nav-item">
          <a href="https://www.ebi.ac.uk/training/" target="_blank" rel="noopener noreferrer">Training</a>
        </li>
        <li className={`nav-item ${isActive('/about') ? 'active' : ''}`}>
          <Link to="/about">About</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
