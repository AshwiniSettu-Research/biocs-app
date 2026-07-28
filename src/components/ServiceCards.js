import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ServiceCards.css';

function ServiceCards() {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    name: '',
    email: '',
    dataType: '',
    description: '',
  });
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    setSubmitForm({ ...submitForm, [e.target.name]: e.target.value });
  };

  const handleSubmitData = async (e) => {
    e.preventDefault();
    setSubmitStatus('sending');

    try {
      const response = await fetch('https://formsubmit.co/ajax/ashwinisettu.as@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: submitForm.name,
          email: submitForm.email,
          dataType: submitForm.dataType,
          description: submitForm.description,
          _subject: `BIOCS Data Submission: ${submitForm.dataType}`,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitForm({ name: '', email: '', dataType: '', description: '' });
        setTimeout(() => setSubmitStatus(''), 3000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus(''), 3000);
      }
    } catch (err) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
    }
  };

  return (
    <>
      {/* Highlights Strip */}
      <section className="highlights-strip">
        <div className="highlight-item">
          <span className="highlight-value">3</span>
          <span className="highlight-label">Active Tools</span>
        </div>
        <div className="highlight-divider"></div>
        <div className="highlight-item">
          <span className="highlight-value">LARE-NW</span>
          <span className="highlight-label">Relative-Entropy Alignment</span>
        </div>
        <div className="highlight-divider"></div>
        <div className="highlight-item">
          <span className="highlight-value">MLPT-LARE</span>
          <span className="highlight-label">Antigenicity Transformer</span>
        </div>
        <div className="highlight-divider"></div>
        <div className="highlight-item">
          <span className="highlight-value">SA-BWK</span>
          <span className="highlight-label">Vaccine Construct Designer</span>
        </div>
      </section>

      {/* Tool Cards */}
      <section className="tools-section">
        <h2 className="tools-section-title">Available Tools</h2>
        <div className="tool-cards">
          <Link to="/service/protein-alignment" className="tool-card tool-card-teal">
            <div className="tool-card-accent"></div>
            <div className="tool-card-body">
              <h3 className="tool-card-title">Protein Sequence Alignment</h3>
              <p className="tool-card-algo">LARE-NW Algorithm</p>
              <p className="tool-card-desc">
                Pairwise alignment that corrects BLOSUM62 scores position-by-position with a Bayesian estimate of local amino-acid composition (relative-entropy Ψ correction) and modulates gap penalties by local sequence entropy, using a banded Gotoh dynamic program.
              </p>
              <div className="tool-card-tags">
                <span className="tool-tag">BLOSUM62</span>
                <span className="tool-tag">Ψ Correction</span>
                <span className="tool-tag">Adaptive Gaps</span>
              </div>
              <span className="tool-card-link">Open Tool &rarr;</span>
            </div>
          </Link>

          <Link to="/service/antigenic-peptide" className="tool-card tool-card-purple">
            <div className="tool-card-accent"></div>
            <div className="tool-card-body">
              <h3 className="tool-card-title">Antigenic Peptide Predictor</h3>
              <p className="tool-card-algo">MLPT-LARE Deep Learning Model</p>
              <p className="tool-card-desc">
                Binary prediction of cancer T-cell antigenic epitopes using a Multi-Level Pooling Transformer over LARE-NW Bayesian posterior features, Kolaskar &amp; Tongaonkar propensity, and physicochemical descriptors.
              </p>
              <div className="tool-card-tags">
                <span className="tool-tag">Swin Transformer</span>
                <span className="tool-tag">LARE-NW Posteriors</span>
                <span className="tool-tag">T-cell Epitope</span>
              </div>
              <span className="tool-card-link">Open Tool &rarr;</span>
            </div>
          </Link>

          <Link to="/service/vaccine-designer" className="tool-card tool-card-indigo">
            <div className="tool-card-accent"></div>
            <div className="tool-card-body">
              <h3 className="tool-card-title">Multi-Epitope Vaccine Designer</h3>
              <p className="tool-card-algo">SA-BWK Multi-Objective Optimiser</p>
              <p className="tool-card-desc">
                Selects a K-peptide vaccine construct from a candidate pool that jointly maximises MLPT-LARE antigenicity, LARE-NW conservation, and HLA population coverage, via a discrete Self-improved Black-Winged Kite metaheuristic.
              </p>
              <div className="tool-card-tags">
                <span className="tool-tag">SA-BWK</span>
                <span className="tool-tag">HLA Coverage</span>
                <span className="tool-tag">Multi-Objective</span>
              </div>
              <span className="tool-card-link">Open Tool &rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Info Sections */}
      <section className="info-sections">
        <div className="info-card info-card-clickable" onClick={() => setShowSubmitModal(true)}>
          <h3 className="info-card-title">Submit Data</h3>
          <p className="info-card-desc">
            Contribute experimental data and derived annotations. Select a data type, describe your submission, and send it directly to the research team.
          </p>
        </div>
        <a href="https://scholar.google.com/citations?user=qVLxihUAAAAJ&hl=en&authuser=2" target="_blank" rel="noopener noreferrer" className="info-card info-card-clickable">
          <h3 className="info-card-title">Research</h3>
          <p className="info-card-desc">
            Access peer-reviewed publications, reproducible workflows, and collaborative tools for computational biology research.
          </p>
        </a>
        <a href="https://www.uniprot.org" target="_blank" rel="noopener noreferrer" className="info-card info-card-clickable">
          <h3 className="info-card-title">Documentation</h3>
          <p className="info-card-desc">
            Browse UniProt — the universal protein knowledgebase for protein sequences, functional information, and cross-references.
          </p>
        </a>
        <a href="https://www.ebi.ac.uk/training/" target="_blank" rel="noopener noreferrer" className="info-card info-card-clickable">
          <h3 className="info-card-title">Training</h3>
          <p className="info-card-desc">
            Online courses and learning materials for bioinformatics analysis methods and the BIOCS platform.
          </p>
        </a>
      </section>

      {/* Submit Data Modal */}
      {showSubmitModal && (
        <div className="submit-modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="submit-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="submit-modal-close" onClick={() => setShowSubmitModal(false)}>
              &times;
            </button>
            <h2 className="submit-modal-title">Submit Data</h2>
            <p className="submit-modal-desc">
              Select the type of data you wish to submit and provide a description. Your submission details will be sent to the research team for review.
            </p>
            <form className="submit-data-form" onSubmit={handleSubmitData}>
              <div className="submit-form-group">
                <label htmlFor="submit-name">Your Name</label>
                <input
                  type="text"
                  id="submit-name"
                  name="name"
                  value={submitForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div className="submit-form-group">
                <label htmlFor="submit-email">Your Email</label>
                <input
                  type="email"
                  id="submit-email"
                  name="email"
                  value={submitForm.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="submit-form-group">
                <label htmlFor="submit-dataType">Data Type</label>
                <select
                  id="submit-dataType"
                  name="dataType"
                  value={submitForm.dataType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a data type</option>
                  <option value="Protein Sequence">Protein Sequence</option>
                  <option value="Genomic Sequence">Genomic Sequence</option>
                  <option value="Peptide Data">Peptide Data</option>
                  <option value="Annotated Assembly">Annotated Assembly</option>
                  <option value="Experimental Results">Experimental Results</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="submit-form-group">
                <label htmlFor="submit-description">Description</label>
                <textarea
                  id="submit-description"
                  name="description"
                  value={submitForm.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe your data, format, and any relevant details"
                  rows="5"
                ></textarea>
              </div>
              <button
                type="submit"
                className="submit-data-btn"
                disabled={submitStatus === 'sending'}
              >
                {submitStatus === 'sending' ? 'Sending...' : 'Submit Data'}
              </button>
              {submitStatus === 'success' && (
                <p className="submit-status success">Submission sent successfully!</p>
              )}
              {submitStatus === 'error' && (
                <p className="submit-status error">Failed to send. Please try again.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ServiceCards;
