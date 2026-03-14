import React, { useState } from 'react';
import { downloadJSON } from '../../utils/api';
import './AntigenicResults.css';

const CLASS_COLORS = {
  'Cancer Antigenic Peptides': '#d32f2f',
  'Inactive Peptides-Lung Breast': '#757575',
  'Moderately Active-Lung Breast': '#f57c00',
  'Natural Peptide': '#388e3c',
  'Non-Natural Peptide': '#1976d2',
  'Very Active-Lung Breast': '#c62828',
};

function AntigenicResults({ results, confidenceThreshold }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPrediction, setSelectedPrediction] = useState(0);

  if (!results || !results.predictions || results.predictions.length === 0) {
    return null;
  }

  const { predictions, model_info } = results;
  const pred = predictions[selectedPrediction] || predictions[0];

  const handleExportJSON = () => {
    downloadJSON(results, 'mlpt-predictions');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'probabilities', label: 'Probabilities' },
    { id: 'antigenicity', label: 'Antigenicity Profile' },
    { id: 'references', label: 'References' },
  ];

  // === OVERVIEW TAB ===
  const renderOverview = () => {
    const isHighConfidence = pred.confidence >= confidenceThreshold;
    return (
      <div className="tab-content">
        {/* Prediction Summary */}
        {!pred.error ? (
          <div className="prediction-summary">
            <div className="pred-main">
              <span
                className="pred-class-badge"
                style={{ background: CLASS_COLORS[pred.predicted_class] || '#555' }}
              >
                {pred.predicted_class}
              </span>
              <div className="pred-confidence-row">
                <span className="pred-confidence-value">
                  {(pred.confidence * 100).toFixed(1)}%
                </span>
                <span className="pred-confidence-label">Confidence</span>
                {!isHighConfidence && (
                  <span className="pred-low-confidence">Below threshold</span>
                )}
              </div>
            </div>
            <div className="pred-details">
              <div className="pred-detail-item">
                <span className="pred-detail-label">Sequence</span>
                <span className="pred-detail-value mono">{pred.sequence}</span>
              </div>
              <div className="pred-detail-item">
                <span className="pred-detail-label">Length</span>
                <span className="pred-detail-value">{pred.sequence_length} residues</span>
              </div>
              <div className="pred-detail-item">
                <span className="pred-detail-label">Antigenicity Score</span>
                <span className="pred-detail-value">{pred.antigenicity_score}</span>
              </div>
              {pred.antigenic_regions && pred.antigenic_regions.length > 0 && (
                <div className="pred-detail-item">
                  <span className="pred-detail-label">Antigenic Regions</span>
                  <span className="pred-detail-value">
                    {pred.antigenic_regions.map(([s, e]) => `${s + 1}-${e + 1}`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pred-error">{pred.error}</div>
        )}

        {/* Batch Summary Table */}
        {predictions.length > 1 && (
          <div className="batch-summary">
            <h3 className="section-title">Batch Results ({predictions.length} sequences)</h3>
            <table className="batch-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sequence</th>
                  <th>Predicted Class</th>
                  <th>Confidence</th>
                  <th>Antigenicity</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr
                    key={i}
                    className={`batch-row ${i === selectedPrediction ? 'selected' : ''} ${
                      p.error ? 'error-row' : ''
                    }`}
                    onClick={() => !p.error && setSelectedPrediction(i)}
                  >
                    <td>{i + 1}</td>
                    <td className="mono seq-cell">
                      {p.error ? p.sequence : p.sequence?.substring(0, 20)}
                      {!p.error && p.sequence?.length > 20 ? '...' : ''}
                    </td>
                    <td>
                      {p.error ? (
                        <span className="error-text">Error</span>
                      ) : (
                        <span
                          className="class-dot"
                          style={{ background: CLASS_COLORS[p.predicted_class] || '#555' }}
                        >
                          {p.predicted_class}
                        </span>
                      )}
                    </td>
                    <td>
                      {p.error ? '—' : `${(p.confidence * 100).toFixed(1)}%`}
                    </td>
                    <td>{p.error ? '—' : p.antigenicity_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Model Info */}
        {model_info && (
          <div className="model-info-box">
            <span className="model-info-label">Model</span>
            <span>MLPT ({model_info.num_classes}-class)</span>
            {model_info.accuracy && (
              <>
                <span className="model-info-label">Accuracy</span>
                <span>{(model_info.accuracy * 100).toFixed(1)}%</span>
              </>
            )}
            {model_info.macro_f1 && (
              <>
                <span className="model-info-label">Macro F1</span>
                <span>{(model_info.macro_f1 * 100).toFixed(1)}%</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // === PROBABILITIES TAB ===
  const renderProbabilities = () => {
    if (pred.error || !pred.probabilities) return <div className="tab-content">No data available.</div>;
    const sorted = Object.entries(pred.probabilities).sort((a, b) => b[1] - a[1]);
    const maxProb = Math.max(...sorted.map(([, v]) => v));

    return (
      <div className="tab-content">
        <h3 className="section-title">Class Probability Distribution</h3>
        <div className="prob-chart">
          {sorted.map(([cls, prob]) => (
            <div className="prob-row" key={cls}>
              <span className="prob-label">{cls}</span>
              <div className="prob-bar-container">
                <div
                  className="prob-bar"
                  style={{
                    width: `${(prob / maxProb) * 100}%`,
                    background: CLASS_COLORS[cls] || '#888',
                  }}
                />
              </div>
              <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === ANTIGENICITY PROFILE TAB ===
  const renderAntigenicity = () => {
    if (pred.error || !pred.kt_scores) return <div className="tab-content">No data available.</div>;

    const scores = pred.kt_scores;
    const maxScore = Math.max(...scores, 1.0);
    const threshold = pred.antigenicity_score || 1.0;

    return (
      <div className="tab-content">
        <h3 className="section-title">Per-Residue Antigenicity (K-T Score)</h3>
        <div className="antigenicity-chart">
          {scores.map((score, i) => {
            const height = (score / maxScore) * 100;
            const isAntigenic = score >= threshold;
            return (
              <div className="kt-bar-wrapper" key={i} title={`${pred.sequence[i]}: ${score.toFixed(3)}`}>
                <div
                  className={`kt-bar ${isAntigenic ? 'kt-bar-antigenic' : ''}`}
                  style={{ height: `${height}%` }}
                />
                <span className="kt-residue">{pred.sequence[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="kt-legend">
          <span className="kt-legend-item">
            <span className="kt-legend-color kt-legend-normal" /> Below threshold
          </span>
          <span className="kt-legend-item">
            <span className="kt-legend-color kt-legend-antigenic" /> Antigenic
          </span>
          <span className="kt-legend-item">
            Avg Score: {pred.antigenicity_score}
          </span>
        </div>
      </div>
    );
  };

  // === REFERENCES TAB ===
  const renderReferences = () => (
    <div className="tab-content">
      <h3 className="section-title">References &amp; Methods</h3>
      <div className="ref-list">
        <div className="ref-item">
          <span className="ref-number">1.</span>
          <div className="ref-text">
            <strong>MLPT Model:</strong> Ashwini S., R.I. Minu, Jeevan Kumar M. &mdash;
            &ldquo;Predicting Antigenic Peptides Using a Multi-Level Pooling-based
            Transformer Model with Enhanced Kolaskar &amp; Tongaonkar&rsquo;s Algorithm
            for Feature Selection&rdquo;
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">2.</span>
          <div className="ref-text">
            <strong>Kolaskar &amp; Tongaonkar (1990):</strong> A semi-empirical method for
            prediction of antigenic determinants on protein antigens.
            <em> FEBS Letters</em>, 276(1-2), 172-174.
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">3.</span>
          <div className="ref-text">
            <strong>SA-BWK Optimizer:</strong> Self-Improved Black-Winged Kite algorithm &mdash;
            bio-inspired meta-heuristic optimization for feature weight selection.
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">4.</span>
          <div className="ref-text">
            <strong>IEDB:</strong> Immune Epitope Database and Analysis Resource.
            <em> https://www.iedb.org</em>
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">5.</span>
          <div className="ref-text">
            <strong>Swin Transformer:</strong> Liu, Z., et al. &ldquo;Swin Transformer:
            Hierarchical Vision Transformer using Shifted Windows.&rdquo;
            <em> ICCV 2021.</em>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'probabilities': return renderProbabilities();
      case 'antigenicity': return renderAntigenicity();
      case 'references': return renderReferences();
      default: return renderOverview();
    }
  };

  return (
    <div className="antigenic-results">
      <div className="results-header">
        <h2>Prediction Results</h2>
        <div className="results-header-actions">
          <button className="export-btn" onClick={handleExportJSON}>
            Download JSON
          </button>
        </div>
      </div>

      <div className="results-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`results-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="results-body">{renderActiveTab()}</div>
    </div>
  );
}

export default AntigenicResults;
