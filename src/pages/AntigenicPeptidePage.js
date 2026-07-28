import React, { useState, useRef, useMemo, useEffect } from 'react';
import AntigenicResults from '../components/antigenic/AntigenicResults';
import ErrorBoundary from '../components/ErrorBoundary';
import { fetchJSON } from '../utils/api';
import './AntigenicPeptidePage.css';

// Published cancer T-cell epitopes (NY-ESO-1, MAGE-A3, MART-1, HER2/E75).
const EXAMPLE_SEQUENCES = [
  'SLLMWITQC',
  'EVDPIGHLY',
  'ELAGIGILTV',
  'KIFGSLAFL',
];

// Tuned F1-optimal decision threshold on P(antigenic) for the shipped model.
const DEFAULT_THRESHOLD = 0.455;

function AntigenicPeptidePage() {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  const fileRef = useRef(null);
  const resultsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadExample = () => {
    setInputText(EXAMPLE_SEQUENCES.join('\n'));
  };

  const clearAll = () => {
    setInputText('');
    setResults(null);
    setError(null);
    setThreshold(DEFAULT_THRESHOLD);
  };

  const parseSequences = (text) => {
    const lines = text.trim().split('\n');
    const sequences = [];
    let currentSeq = '';
    let hasFastaHeaders = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('>')) {
        hasFastaHeaders = true;
        if (currentSeq) {
          sequences.push(currentSeq);
          currentSeq = '';
        }
        continue;
      }
      currentSeq += trimmed;
    }
    if (currentSeq) sequences.push(currentSeq);

    // If no FASTA headers, treat each non-empty line as a separate sequence
    if (!hasFastaHeaders) {
      return lines.map((l) => l.trim()).filter(Boolean);
    }
    return sequences;
  };

  // Cancel any in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setResults(null);

    if (!inputText.trim()) {
      setError('Please enter at least one peptide sequence.');
      return;
    }

    const sequences = parseSequences(inputText);
    if (sequences.length === 0) {
      setError('No valid sequences found in input.');
      return;
    }

    if (sequences.length > 100) {
      setError('Maximum 100 sequences per request. Please reduce your input.');
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    try {
      const data = await fetchJSON('/api/mlpt/predict', {
        method: 'POST',
        body: JSON.stringify({ sequences, threshold }),
        signal: controller.signal,
      });

      setResults(data);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to connect to the prediction server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sequenceCount = useMemo(
    () => (inputText.trim() ? parseSequences(inputText).length : 0),
    [inputText]
  );

  return (
    <div className="tool-page">
      {/* Tool Header */}
      <div className="tool-header antigenic-header">
        <h1>MLPT-LARE Antigenic Peptide Predictor</h1>
        <div className="tool-header-actions">
          <button className="tool-header-btn">Documentation</button>
          <button className="tool-header-btn">Help</button>
        </div>
      </div>

      {/* Tool Content */}
      <div className="tool-content">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button className="dismiss-btn" onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* Algorithm Info Banner */}
        <div className="algo-info-banner antigenic-banner">
          <div className="algo-info-title">Multi-Level Pooling Transformer over LARE-NW posteriors (MLPT-LARE)</div>
          <div className="algo-info-desc">
            A deep-learning model that predicts whether a peptide is a
            cancer T-cell antigenic epitope. It runs a Multi-Level Pooling
            Transformer (ADMAM &rarr; 1-D Swin blocks &rarr; masked pooling) over a
            per-residue stream of LARE-NW Bayesian posterior features and
            Kolaskar &amp; Tongaonkar propensity, fused with physicochemical
            descriptors. Trained on curated CEDAR + IEDB cancer peptides;
            outputs a probability plus a class at a tunable decision threshold.
          </div>
          <div className="algo-info-tags">
            <span className="algo-tag">LARE-NW Posteriors</span>
            <span className="algo-tag">ADMAM</span>
            <span className="algo-tag">1D Swin Transformer</span>
            <span className="algo-tag">K-T Propensity</span>
            <span className="algo-tag">Multi-Level Pooling</span>
            <span className="algo-tag">Binary Classifier</span>
          </div>
        </div>

        {/* STEP 1: Input */}
        <div className="tool-step">
          <div className="step-header">STEP 1 &mdash; Input Peptide Sequences</div>
          <div className="step-body">
            <div className="input-help-row">
              <span className="input-help-text">
                Enter one or more peptide sequences (one per line), paste FASTA format, or upload a file.
              </span>
              <button className="example-btn" onClick={loadExample}>
                Load Example Sequences
              </button>
            </div>
            <textarea
              className="sequence-textarea antigenic-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={"Enter peptide sequences, one per line...\ne.g. FIASNGVKLV\n     GILGFVFTL\n\nOr paste FASTA format:\n>peptide_1\nFIASNGVKLV"}
              spellCheck={false}
            />
            <div className="seq-meta-row">
              <span className="seq-char-count">
                {sequenceCount} sequence{sequenceCount !== 1 ? 's' : ''} detected
              </span>
              <label className="file-upload-label">
                <input
                  type="file"
                  accept=".fasta,.fa,.txt,.seq,.csv"
                  ref={fileRef}
                  onChange={handleFileUpload}
                />
                Upload File
              </label>
            </div>
          </div>
        </div>

        {/* STEP 2: Options */}
        <div className="tool-step">
          <div className="step-header">STEP 2 &mdash; Options</div>
          <div className="step-body">
            <div className="options-row">
              <div className="param-group">
                <label>Decision Threshold — P(antigenic)</label>
                <div className="slider-row">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  />
                  <span className="slider-value">{threshold.toFixed(3)}</span>
                </div>
                <span className="param-hint">
                  Probability cutoff for the Antigenic / Non-antigenic label.
                  Default {DEFAULT_THRESHOLD} is the F1-optimal operating point;
                  MLPT-LARE is a ranking model, so this is not 0.5. Higher =
                  stricter (fewer positives).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Submit */}
        <div className="tool-step">
          <div className="step-header">STEP 3 &mdash; Run Prediction</div>
          <div className="step-body">
            <div className="submit-section">
              <button
                className="submit-btn antigenic-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Predicting...' : 'Submit Prediction'}
              </button>
              <button className="clear-all-btn" onClick={clearAll}>
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner antigenic-spinner"></div>
            <span>Running MLPT-LARE prediction...</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div ref={resultsRef}>
            <ErrorBoundary>
              <AntigenicResults results={results} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

export default AntigenicPeptidePage;
