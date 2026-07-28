import React, { useState } from 'react';
import { downloadJSON } from '../../utils/api';
import './AntigenicResults.css';

const CLASS_COLORS = {
  'Antigenic': '#2e7d32',
  'Non-antigenic': '#757575',
};

// K-T antigenic cutoff: residues at/above the average antigenic propensity.
const KT_THRESHOLD = 1.0;

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function AntigenicResults({ results }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPrediction, setSelectedPrediction] = useState(0);

  if (!results || !results.predictions || results.predictions.length === 0) {
    return null;
  }

  const { predictions, model_info } = results;
  const pred = predictions[selectedPrediction] || predictions[0];

  const handleExportJSON = () => {
    downloadJSON(results, 'mlpt-lare-predictions');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'probabilities', label: 'Probabilities' },
    { id: 'antigenicity', label: 'Antigenicity Profile' },
    { id: 'references', label: 'References' },
  ];

  // === OVERVIEW TAB ===
  const renderOverview = () => {
    return (
      <div className="tab-content">
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
                  {pct(pred.antigenic_probability)}
                </span>
                <span className="pred-confidence-label">P(antigenic)</span>
                <span className="pred-threshold-note">
                  threshold {pct(pred.decision_threshold)}
                </span>
              </div>
            </div>

            {pred.warning && (
              <div className="pred-warning">{pred.warning}</div>
            )}

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
                <span className="pred-detail-label">Confidence (predicted class)</span>
                <span className="pred-detail-value">{pct(pred.confidence)}</span>
              </div>
              <div className="pred-detail-item">
                <span className="pred-detail-label">Mean K-T Antigenicity</span>
                <span className="pred-detail-value">{pred.antigenicity_score}</span>
              </div>
              <div className="pred-detail-item">
                <span className="pred-detail-label">Mean Posterior Entropy</span>
                <span className="pred-detail-value">{pred.mean_posterior_entropy}</span>
              </div>
              {pred.antigenic_regions && pred.antigenic_regions.length > 0 && (
                <div className="pred-detail-item">
                  <span className="pred-detail-label">K-T Antigenic Regions</span>
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
                  <th>Prediction</th>
                  <th>P(antigenic)</th>
                  <th>Mean K-T</th>
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
                    <td>{p.error ? '—' : pct(p.antigenic_probability)}</td>
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
            <span>{model_info.model} (binary)</span>
            {model_info.params && (
              <>
                <span className="model-info-label">Parameters</span>
                <span>{model_info.params.toLocaleString()}</span>
              </>
            )}
            {model_info.auc_roc && (
              <>
                <span className="model-info-label">Test AUC-ROC</span>
                <span>{model_info.auc_roc}</span>
              </>
            )}
            {model_info.f1 && (
              <>
                <span className="model-info-label">Test F1</span>
                <span>{model_info.f1}</span>
              </>
            )}
            {model_info.mcc && (
              <>
                <span className="model-info-label">Test MCC</span>
                <span>{model_info.mcc}</span>
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
              <span className="prob-value">{pct(prob)}</span>
            </div>
          ))}
        </div>
        <p className="prob-note">
          MLPT-LARE is a ranking model; probabilities are compressed. The class
          label uses a tuned decision threshold ({pct(pred.decision_threshold)}),
          not 0.5 — adjust it in Step&nbsp;2 to rebalance sensitivity vs.
          specificity.
        </p>
      </div>
    );
  };

  // === ANTIGENICITY PROFILE TAB ===
  const renderAntigenicity = () => {
    if (pred.error || !pred.kt_scores) return <div className="tab-content">No data available.</div>;

    const scores = pred.kt_scores;
    const maxScore = Math.max(...scores, 1.2);

    return (
      <div className="tab-content">
        <h3 className="section-title">Per-Residue Antigenicity (K-T Propensity)</h3>
        <div className="antigenicity-chart">
          {scores.map((score, i) => {
            const height = (score / maxScore) * 100;
            const isAntigenic = score >= KT_THRESHOLD;
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
            <span className="kt-legend-color kt-legend-normal" /> Below threshold ({KT_THRESHOLD.toFixed(1)})
          </span>
          <span className="kt-legend-item">
            <span className="kt-legend-color kt-legend-antigenic" /> Antigenic (≥ {KT_THRESHOLD.toFixed(1)})
          </span>
          <span className="kt-legend-item">
            Mean: {pred.antigenicity_score}
          </span>
        </div>
        <p className="prob-note">
          These Kolaskar &amp; Tongaonkar propensities are one of the model's
          input channels (alongside the 20-dim LARE-NW Bayesian posterior), not
          a separate prediction.
        </p>
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
            <strong>MLPT-LARE:</strong> Objective 2 of the thesis &mdash; a Multi-Level
            Pooling Transformer (ADMAM &rarr; 1-D Swin blocks &rarr; masked pooling,
            199,225 parameters) for binary cancer T-cell antigenic-epitope
            prediction, trained on curated CEDAR + IEDB cancer peptides.
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">2.</span>
          <div className="ref-text">
            <strong>LARE-NW posterior features:</strong> Objective 1 &mdash; per-residue
            Dirichlet-multinomial posterior over local amino-acid composition,
            forming the model's 20-channel input stream.
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">3.</span>
          <div className="ref-text">
            <strong>Kolaskar &amp; Tongaonkar (1990):</strong> A semi-empirical method for
            prediction of antigenic determinants on protein antigens.
            <em> FEBS Letters</em>, 276(1-2), 172-174.
          </div>
        </div>
        <div className="ref-item">
          <span className="ref-number">4.</span>
          <div className="ref-text">
            <strong>SA-BWK Optimizer:</strong> Self-improved Black-Winged Kite algorithm
            &mdash; used to tune the LARE-NW posterior hyperparameters (&alpha;, window).
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
        <div className="ref-item">
          <span className="ref-number">6.</span>
          <div className="ref-text">
            <strong>CEDAR / IEDB:</strong> Cancer Epitope Database and Analysis Resource;
            Immune Epitope Database. <em>https://cedar.iedb.org</em>
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
