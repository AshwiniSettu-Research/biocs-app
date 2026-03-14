import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import AlignmentResults from '../components/alignment/AlignmentResults';
import ErrorBoundary from '../components/ErrorBoundary';
import { fetchJSON } from '../utils/api';
import './ProteinAlignmentPage.css';

const EXAMPLE_SEQ1 = 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH';
const EXAMPLE_SEQ2 = 'MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLST';

const DEFAULT_PARAMS = {
  alpha: 0.5, beta: 0.3, gap_open: -10.0, gap_extend: -1.0, bandwidth: 5,
};

const numOrDefault = (value, fallback) => {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
};

function SequenceInputGroup({
  label, sequence, setSequence, uniprotId, setUniprotId,
  fetching, seqKey, fileRef, placeholder, uniprotPlaceholder,
  onFileUpload, onFetchUniprot, residueCount,
}) {
  return (
    <div className="sequence-input-group">
      <div className="sequence-label">
        <span>{label}</span>
        <div className="sequence-actions">
          <button className="seq-action-btn" onClick={() => { setSequence(''); setUniprotId(''); }}>
            Clear
          </button>
        </div>
      </div>
      <textarea
        className="sequence-textarea"
        value={sequence}
        onChange={(e) => setSequence(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      <div className="seq-char-count">{residueCount} residues</div>
      <div className="seq-tools-row">
        <label className="file-upload-label">
          <input
            type="file"
            accept=".fasta,.fa,.txt,.seq"
            ref={fileRef}
            onChange={(e) => onFileUpload(e, setSequence)}
          />
          Upload FASTA
        </label>
        <div className="uniprot-fetch">
          <input
            type="text"
            className="uniprot-input"
            placeholder={uniprotPlaceholder}
            value={uniprotId}
            onChange={(e) => setUniprotId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onFetchUniprot(uniprotId, setSequence, seqKey)}
          />
          <button
            className="uniprot-btn"
            onClick={() => onFetchUniprot(uniprotId, setSequence, seqKey)}
            disabled={fetching}
          >
            {fetching ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProteinAlignmentPage() {
  const [seq1, setSeq1] = useState('');
  const [seq2, setSeq2] = useState('');
  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UniProt lookup
  const [uniprotId1, setUniprotId1] = useState('');
  const [uniprotId2, setUniprotId2] = useState('');
  const [fetchingUniprot, setFetchingUniprot] = useState({ seq1: false, seq2: false });

  const fileRef1 = useRef(null);
  const fileRef2 = useRef(null);
  const resultsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const countResidues = (seq) => seq.replace(/[^A-Za-z]/g, '').length;
  const residueCount1 = useMemo(() => countResidues(seq1), [seq1]);
  const residueCount2 = useMemo(() => countResidues(seq2), [seq2]);

  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fetchFromUniprot = useCallback(async (uniprotId, setter, seqKey) => {
    if (!uniprotId.trim()) return;
    setFetchingUniprot((prev) => ({ ...prev, [seqKey]: true }));
    setError(null);
    try {
      const data = await fetchJSON(`/api/uniprot/${uniprotId.trim()}`);
      setter(`>${data.entry_name} | ${data.protein_name}\n${data.sequence}`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`UniProt fetch failed: ${err.message}`);
      }
    } finally {
      setFetchingUniprot((prev) => ({ ...prev, [seqKey]: false }));
    }
  }, []);

  const loadExample = () => {
    setSeq1('>HBA_HUMAN | Hemoglobin subunit alpha\n' + EXAMPLE_SEQ1);
    setSeq2('>HBB_HUMAN | Hemoglobin subunit beta\n' + EXAMPLE_SEQ2);
  };

  const clearAll = () => {
    setSeq1('');
    setSeq2('');
    setUniprotId1('');
    setUniprotId2('');
    setResults(null);
    setError(null);
    setParams({ ...DEFAULT_PARAMS });
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

    if (!seq1.trim() || !seq2.trim()) {
      setError('Please enter both sequences before submitting.');
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
      const payload = {
        seq1: seq1.trim(),
        seq2: seq2.trim(),
        algorithm: 'cm_blosum_nw',
        params: {
          alpha: numOrDefault(params.alpha, 0.5),
          beta: numOrDefault(params.beta, 0.3),
          gap_open: numOrDefault(params.gap_open, -10.0),
          gap_extend: numOrDefault(params.gap_extend, -1.0),
          bandwidth: numOrDefault(params.bandwidth, 5),
        },
      };

      const data = await fetchJSON('/api/align', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      setResults(data.results);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to connect to the alignment server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-page">
      {/* Tool Header */}
      <div className="tool-header">
        <h1>CM-BLOSUM-NW Protein Sequence Alignment</h1>
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
        <div className="algo-info-banner">
          <div className="algo-info-title">Compositionally Modulated BLOSUM Needleman-Wunsch</div>
          <div className="algo-info-desc">
            A novel pairwise sequence alignment algorithm that integrates BLOSUM62 substitution scores
            with Information Content (IC) and Dipeptide Composition (DPC) modulation,
            using affine gap penalties and banded dynamic programming for efficient computation.
          </div>
          <div className="algo-info-tags">
            <span className="algo-tag">BLOSUM62</span>
            <span className="algo-tag">Information Content</span>
            <span className="algo-tag">Dipeptide Log-Odds</span>
            <span className="algo-tag">Affine Gap (Gotoh 1982)</span>
            <span className="algo-tag">Banded DP</span>
          </div>
        </div>

        {/* STEP 1: Sequence Input */}
        <div className="tool-step">
          <div className="step-header">STEP 1 &mdash; Input Sequences</div>
          <div className="step-body">
            <div className="input-help-row">
              <span className="input-help-text">
                Enter protein sequences in plain text or FASTA format, upload a file, or fetch directly from UniProt.
              </span>
              <button className="example-btn" onClick={loadExample}>
                Load Example (Hemoglobin &alpha; vs &beta;)
              </button>
            </div>
            <div className="sequence-inputs">
              <SequenceInputGroup
                label="Sequence 1"
                sequence={seq1}
                setSequence={setSeq1}
                uniprotId={uniprotId1}
                setUniprotId={setUniprotId1}
                fetching={fetchingUniprot.seq1}
                seqKey="seq1"
                fileRef={fileRef1}
                placeholder={"Paste protein sequence or FASTA...\ne.g. MVLSPADKTNVKAAWGKVGA..."}
                uniprotPlaceholder="UniProt ID (e.g. P69905)"
                onFileUpload={handleFileUpload}
                onFetchUniprot={fetchFromUniprot}
                residueCount={residueCount1}
              />
              <SequenceInputGroup
                label="Sequence 2"
                sequence={seq2}
                setSequence={setSeq2}
                uniprotId={uniprotId2}
                setUniprotId={setUniprotId2}
                fetching={fetchingUniprot.seq2}
                seqKey="seq2"
                fileRef={fileRef2}
                placeholder={"Paste protein sequence or FASTA...\ne.g. MVHLTPEEKSAVTALWGKVNV..."}
                uniprotPlaceholder="UniProt ID (e.g. P68871)"
                onFileUpload={handleFileUpload}
                onFetchUniprot={fetchFromUniprot}
                residueCount={residueCount2}
              />
            </div>
          </div>
        </div>

        {/* STEP 2: Parameters */}
        <div className="tool-step">
          <div className="step-header">STEP 2 &mdash; Configure Parameters</div>
          <div className="step-body">
            <div className="params-grid">
              <div className="param-group">
                <label>Alpha (&alpha;)</label>
                <input
                  type="number"
                  step="0.1"
                  value={params.alpha}
                  onChange={(e) => handleParamChange('alpha', e.target.value)}
                  min="0"
                  max="1"
                />
                <span className="param-hint">Information Content modulation weight (0-1)</span>
              </div>
              <div className="param-group">
                <label>Beta (&beta;)</label>
                <input
                  type="number"
                  step="0.1"
                  value={params.beta}
                  onChange={(e) => handleParamChange('beta', e.target.value)}
                  min="0"
                  max="1"
                />
                <span className="param-hint">Dipeptide Composition modulation weight (0-1)</span>
              </div>
              <div className="param-group">
                <label>Gap Open</label>
                <input
                  type="number"
                  step="1"
                  value={params.gap_open}
                  onChange={(e) => handleParamChange('gap_open', e.target.value)}
                />
                <span className="param-hint">Affine gap opening penalty (Gotoh model)</span>
              </div>
              <div className="param-group">
                <label>Gap Extend</label>
                <input
                  type="number"
                  step="0.5"
                  value={params.gap_extend}
                  onChange={(e) => handleParamChange('gap_extend', e.target.value)}
                />
                <span className="param-hint">Affine gap extension penalty</span>
              </div>
              <div className="param-group">
                <label>Bandwidth (k)</label>
                <input
                  type="number"
                  value={params.bandwidth}
                  onChange={(e) => handleParamChange('bandwidth', e.target.value)}
                  min="1"
                  max="50"
                />
                <span className="param-hint">Banded DP width for computational efficiency (1-50)</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Submit */}
        <div className="tool-step">
          <div className="step-header">STEP 3 &mdash; Run Alignment</div>
          <div className="step-body">
            <div className="submit-section">
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Aligning...' : 'Submit Alignment'}
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
            <div className="spinner"></div>
            <span>Running CM-BLOSUM-NW alignment...</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div ref={resultsRef}>
            <ErrorBoundary>
              <AlignmentResults results={results} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProteinAlignmentPage;
