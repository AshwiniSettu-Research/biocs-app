import React from 'react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';

function HeroBanner() {
  const basePairs = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div className="hero-banner">
      <div className="hero-bg-animation">
        <svg className="dna-svg" viewBox="0 0 1200 200" preserveAspectRatio="none">
          {/* Top strand */}
          <path
            className="dna-strand dna-strand-top"
            d="M0,60 Q30,20 60,60 Q90,100 120,60 Q150,20 180,60 Q210,100 240,60 Q270,20 300,60 Q330,100 360,60 Q390,20 420,60 Q450,100 480,60 Q510,20 540,60 Q570,100 600,60 Q630,20 660,60 Q690,100 720,60 Q750,20 780,60 Q810,100 840,60 Q870,20 900,60 Q930,100 960,60 Q990,20 1020,60 Q1050,100 1080,60 Q1110,20 1140,60 Q1170,100 1200,60"
            fill="none"
            stroke="rgba(0, 188, 212, 0.5)"
            strokeWidth="2.5"
          />
          {/* Bottom strand */}
          <path
            className="dna-strand dna-strand-bottom"
            d="M0,140 Q30,180 60,140 Q90,100 120,140 Q150,180 180,140 Q210,100 240,140 Q270,180 300,140 Q330,100 360,140 Q390,180 420,140 Q450,100 480,140 Q510,180 540,140 Q570,100 600,140 Q630,180 660,140 Q690,100 720,140 Q750,180 780,140 Q810,100 840,140 Q870,180 900,140 Q930,100 960,140 Q990,180 1020,140 Q1050,100 1080,140 Q1110,180 1140,140 Q1170,100 1200,140"
            fill="none"
            stroke="rgba(0, 229, 255, 0.4)"
            strokeWidth="2.5"
          />
          {/* Base pair rungs connecting the two strands */}
          {basePairs.map((i) => {
            const x = i * 30 + 15;
            const phase = (i * Math.PI) / 2;
            const topY = 60 + 40 * Math.sin(phase);
            const bottomY = 140 - 40 * Math.sin(phase);
            const colors = ['#00bcd4', '#4dd0e1', '#26c6da', '#00acc1'];
            return (
              <line
                key={i}
                className="dna-rung"
                x1={x}
                y1={topY}
                x2={x}
                y2={bottomY}
                stroke={colors[i % 4]}
                strokeWidth="1.5"
                opacity="0.3"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            );
          })}
          {/* Nucleotide dots on strands */}
          {basePairs.map((i) => {
            const x = i * 30 + 15;
            const phase = (i * Math.PI) / 2;
            const topY = 60 + 40 * Math.sin(phase);
            const bottomY = 140 - 40 * Math.sin(phase);
            return (
              <React.Fragment key={`dots-${i}`}>
                <circle cx={x} cy={topY} r="3" fill="#00e5ff" opacity="0.5" className="dna-dot" style={{ animationDelay: `${i * 0.08}s` }} />
                <circle cx={x} cy={bottomY} r="3" fill="#00bcd4" opacity="0.5" className="dna-dot" style={{ animationDelay: `${i * 0.08 + 0.04}s` }} />
              </React.Fragment>
            );
          })}
        </svg>
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
