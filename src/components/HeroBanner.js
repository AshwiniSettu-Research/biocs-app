import React from 'react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

function HeroBanner() {
  return (
    <div className="hero-banner">
      <div className="hero-bg-animation">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="helix-pair" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="helix-dot top"></div>
            <div className="helix-line"></div>
            <div className="helix-dot bottom"></div>
          </div>
        ))}
      </div>
      <div className="hero-content">
        <h1 className="hero-title">Biosequence Analysis Platform</h1>
        <p className="hero-subtitle">
          Advanced computational tools for protein sequence alignment and antigenic peptide prediction — powered by custom algorithms and deep learning.
        </p>
        <div className="hero-actions">
          <Link to="/service/protein-alignment" className="hero-btn hero-btn-primary">
            Protein Alignment
          </Link>
          <Link to="/service/antigenic-peptide" className="hero-btn hero-btn-secondary">
            Peptide Predictor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
