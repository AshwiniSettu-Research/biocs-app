import React, { useState, useRef, useMemo, useEffect } from 'react';
import VaccineResults from '../components/vaccine/VaccineResults';
import ErrorBoundary from '../components/ErrorBoundary';
import { fetchJSON } from '../utils/api';
import './VaccineDesignerPage.css';

// A small demo pool of published tumour epitopes + a few extra candidates.
const EXAMPLE_PEPTIDES = [
  'SLLMWITQC', 'EVDPIGHLY', 'ELAGIGILTV', 'KIFGSLAFL', 'GILGFVFTL',
  'NLVPMVATV', 'RMFPNAPYL', 'YMDGTMSQV', 'VFHVNDSGSF', 'KEFTRLLNL',
  'LLAAWSLNW', 'IMDQVPFSV', 'AAGIGILTV', 'HDGGVLLLG', 'FLWGPRALV',
];

const POPULATIONS = [
  { id: 'caucasoid', label: 'Caucasoid (European)' },
  { id: 'asian', label: 'East Asian' },
  { id: 'indian_subcontinent', label: 'Indian subcontinent' },
  { id: 'global', label: 'Global (world average)' },
];

const DEFAULT_WEIGHTS = { antigenicity: 0.5, conservation: 0.3, coverage: 0.2 };

function VaccineDesignerPage() {
  const [inputText, setInputText] = useState('');
  const [referencesText, setReferencesText] = useState('');
  const [population, setPopulation] = useState('caucasoid');
  const [k, setK] = useState(10);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [applyFilters, setApplyFilters] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileRef = useRef(null);
  const resultsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const parsePeptides = (text) =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('>'))
      .flatMap((l) => l.split(/[\s,;]+/))
      .filter(Boolean);

  const peptideCount = useMemo(
    () => (inputText.trim() ? parsePeptides(inputText).length : 0),
    [inputText]
  );

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInputText(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadExample = () => setInputText(EXAMPLE_PEPTIDES.join('\n'));

  const clearAll = () => {
    setInputText('');
    setReferencesText('');
    setPopulation('caucasoid');
    setK(10);
    setWeights(DEFAULT_WEIGHTS);
    setApplyFilters(true);
    setResults(null);
    setError(null);
  };

  useEffect(() => () => abortControllerRef.current && abortControllerRef.current.abort(), []);

  const handleSubmit = async () => {
    setError(null);
    setResults(null);

    const peptides = parsePeptides(inputText);
    if (peptides.length === 0) {
      setError('Please enter at least a few candidate peptides (one per line).');
      return;
    }
    if (peptides.length < k + 1) {
      setError(`Construct size K=${k} needs more than ${k} candidate peptides (you have ${peptides.length}).`);
      return;
    }
    if (peptides.length > 400) {
      setError('Maximum 400 candidate peptides per request.');
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    try {
      const data = await fetchJSON('/api/vaxdesign/design', {
        method: 'POST',
        body: JSON.stringify({
          peptides,
          references: referencesText.trim() || undefined,
          population,
          k,
          weights,
          apply_filters: applyFilters,
        }),
        signal: controller.signal,
      });
      setResults(data);
      setTimeout(() => {
        resultsRef.current &&
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to connect to the design server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setWeight = (key, val) => setWeights((w) => ({ ...w, [key]: val }));

  return (
    <div className="tool-page">
      <div className="tool-header vaccine-header">
        <h1>Multi-Epitope Vaccine Designer</h1>
        <div className="tool-header-actions">
          <button className="tool-header-btn">Documentation</button>
          <button className="tool-header-btn">Help</button>
        </div>
      </div>

      <div className="tool-content">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button className="dismiss-btn" onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <div className="algo-info-banner vaccine-banner">
          <div className="algo-info-title">SA-BWK Multi-Objective Construct Designer</div>
          <div className="algo-info-desc">
            Selects a K-peptide vaccine construct from your candidate pool that
            jointly maximises predicted antigenicity (MLPT-LARE, Tool&nbsp;2),
            cross-variant conservation (LARE-NW, Tool&nbsp;1, when reference
            sequences are supplied), and HLA population coverage — optimised with
            a discrete Self-improved Black-Winged Kite (SA-BWK) metaheuristic and
            benchmarked against greedy and random selection.
          </div>
          <div className="algo-info-tags">
            <span className="algo-tag">SA-BWK</span>
            <span className="algo-tag">MLPT-LARE Antigenicity</span>
            <span className="algo-tag">LARE-NW Conservation</span>
            <span className="algo-tag">HLA Coverage</span>
            <span className="algo-tag">Multi-Objective</span>
          </div>
        </div>

        {/* STEP 1 — candidate peptides */}
        <div className="tool-step">
          <div className="step-header">STEP 1 &mdash; Candidate Peptides</div>
          <div className="step-body">
            <div className="input-help-row">
              <span className="input-help-text">
                Paste your candidate epitope pool (one peptide per line; 8&ndash;11-mers
                for HLA class-I coverage). These are typically the top-ranked peptides
                from the Antigenic Peptide Predictor.
              </span>
              <button className="example-btn" onClick={loadExample}>Load Example Pool</button>
            </div>
            <textarea
              className="sequence-textarea vaccine-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={'One peptide per line, e.g.\nSLLMWITQC\nEVDPIGHLY\nELAGIGILTV'}
              spellCheck={false}
            />
            <div className="seq-meta-row">
              <span className="seq-char-count">
                {peptideCount} candidate{peptideCount !== 1 ? 's' : ''} detected
              </span>
              <label className="file-upload-label">
                <input type="file" accept=".fasta,.fa,.txt,.seq,.csv" ref={fileRef} onChange={handleFileUpload} />
                Upload File
              </label>
            </div>
          </div>
        </div>

        {/* STEP 2 — design options */}
        <div className="tool-step">
          <div className="step-header">STEP 2 &mdash; Design Options</div>
          <div className="step-body">
            <div className="options-grid">
              <div className="param-group">
                <label>Target HLA Population</label>
                <select
                  className="vaccine-select"
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                >
                  {POPULATIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <span className="param-hint">Population whose HLA allele frequencies drive coverage.</span>
              </div>

              <div className="param-group">
                <label>Construct Size (K)</label>
                <div className="slider-row">
                  <input type="range" min="2" max="30" step="1" value={k}
                    onChange={(e) => setK(parseInt(e.target.value, 10))} />
                  <span className="slider-value">{k}</span>
                </div>
                <span className="param-hint">Number of peptides in the final construct.</span>
              </div>

              <div className="param-group param-group-check">
                <label className="check-label">
                  <input type="checkbox" checked={applyFilters}
                    onChange={(e) => setApplyFilters(e.target.checked)} />
                  Apply druggability filters
                </label>
                <span className="param-hint">
                  Drop peptides with excess cysteines, high instability, or extreme hydrophobicity before optimising.
                </span>
              </div>
            </div>

            <div className="reference-block">
              <label>Reference / Variant Sequences (optional &mdash; enables conservation)</label>
              <textarea
                className="sequence-textarea reference-textarea"
                value={referencesText}
                onChange={(e) => setReferencesText(e.target.value)}
                placeholder={'Paste full-length source-protein orthologs or variants (FASTA or one per line).\nLeave blank to skip conservation scoring.'}
                spellCheck={false}
              />
              <span className="param-hint">
                When provided, each candidate is scored for LARE-NW conservation across these variants
                (hybrid BLOSUM62 + Bayesian posterior). Otherwise the conservation term is inactive.
              </span>
            </div>

            <button className="advanced-toggle" onClick={() => setShowAdvanced((s) => !s)}>
              {showAdvanced ? '▾' : '▸'} Advanced: fitness weights
            </button>
            {showAdvanced && (
              <div className="weights-grid">
                {['antigenicity', 'conservation', 'coverage'].map((key) => (
                  <div className="param-group" key={key}>
                    <label style={{ textTransform: 'capitalize' }}>{key}</label>
                    <div className="slider-row">
                      <input type="range" min="0" max="1" step="0.05" value={weights[key]}
                        onChange={(e) => setWeight(key, parseFloat(e.target.value))} />
                      <span className="slider-value">{weights[key].toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <button className="reset-weights-btn" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
                  Reset to thesis defaults (0.5 / 0.3 / 0.2)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3 — run */}
        <div className="tool-step">
          <div className="step-header">STEP 3 &mdash; Design Construct</div>
          <div className="step-body">
            <div className="submit-section">
              <button className="submit-btn vaccine-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Designing...' : 'Design Vaccine Construct'}
              </button>
              <button className="clear-all-btn" onClick={clearAll}>Clear All</button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="spinner vaccine-spinner"></div>
            <span>Running SA-BWK optimisation...</span>
          </div>
        )}

        {results && (
          <div ref={resultsRef}>
            <ErrorBoundary>
              <VaccineResults results={results} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

export default VaccineDesignerPage;
