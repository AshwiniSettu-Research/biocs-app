import React, { useState } from 'react';
import { downloadJSON } from '../../utils/api';
import './AlignmentResults.css';

// LARE-NW substitution categories -> CSS class + match-line symbol.
const CATEGORY_TO_CSS = {
  identical: 'res-match',
  similar: 'res-conservative',
  mismatch: 'res-mismatch',
  gap: 'res-gap',
};

const CATEGORY_TO_SYMBOL = {
  identical: '|',
  similar: ':',
  mismatch: ' ',
  gap: ' ',
};

/**
 * Generic per-position track: renders an array of {pos, value} as a bar plot.
 * `mode='unsigned'` draws bars up from the baseline (e.g. entropy in [0,1]).
 * `mode='signed'` draws diverging bars from a centre line (e.g. Ψ corrections).
 */
function PositionTrack({ points, mode = 'unsigned', color = '#1a5276', negColor = '#c62828', formatValue }) {
  if (!points || points.length === 0) {
    return <p className="chart-desc">No data available.</p>;
  }
  const values = points.map((p) => p.value);
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 1e-9);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const fmt = formatValue || ((v) => v.toFixed(3));

  if (mode === 'signed') {
    return (
      <div className="lare-track lare-track-signed">
        {points.map((p, i) => {
          const h = (Math.abs(p.value) / maxAbs) * 50; // half-height %
          const positive = p.value >= 0;
          return (
            <div key={i} className="lare-track-col" title={`Pos ${p.pos}: ${fmt(p.value)}`}>
              <div className="lare-track-uphalf">
                {positive && (
                  <div className="lare-bar" style={{ height: `${h}%`, background: color }}></div>
                )}
              </div>
              <div className="lare-track-midline"></div>
              <div className="lare-track-downhalf">
                {!positive && (
                  <div className="lare-bar lare-bar-down" style={{ height: `${h}%`, background: negColor }}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // unsigned: normalise within [min, max] so variation is visible
  const span = maxVal - minVal || 1;
  return (
    <div className="lare-track">
      {points.map((p, i) => {
        const h = 10 + ((p.value - minVal) / span) * 90; // 10–100%
        return (
          <div
            key={i}
            className="lare-bar"
            style={{ height: `${h}%`, background: color }}
            title={`Pos ${p.pos}: ${fmt(p.value)}`}
          ></div>
        );
      })}
    </div>
  );
}

function AlignmentResults({ results }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!results || results.length === 0) return null;
  const result = results[0]; // LARE-NW: single pairwise result

  const handleExportJSON = () => {
    downloadJSON(result, 'lare-nw-alignment');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'alignment', label: 'Pairwise Alignment' },
    { id: 'psi', label: 'Ψ Correction' },
    { id: 'complexity', label: 'Complexity & Gaps' },
    { id: 'references', label: 'References' },
  ];

  // Substitution-class counts derived from the result.
  const len = result.alignment_length || 0;
  const identicalCount = result.matches || 0;
  const similarCount = Math.max(0, (result.similarity_count || 0) - identicalCount);
  const mismatchCount = Math.max(0, (len - (result.gaps || 0)) - (result.similarity_count || 0));
  const gapCount = result.gaps || 0;
  const pct = (c) => (len ? (100 * c) / len : 0);

  // === OVERVIEW TAB ===
  const renderOverview = () => {
    const segs = [
      { key: 'identical', label: 'Identical', count: identicalCount, cls: 'bar-identical', legend: 'legend-identical' },
      { key: 'similar', label: 'Similar (BLOSUM62 > 0)', count: similarCount, cls: 'bar-conservative', legend: 'legend-conservative' },
      { key: 'mismatch', label: 'Mismatch (BLOSUM62 ≤ 0)', count: mismatchCount, cls: 'bar-non-conservative', legend: 'legend-non-conservative' },
      { key: 'gap', label: 'Gaps', count: gapCount, cls: 'bar-gap', legend: 'legend-gap' },
    ];

    return (
      <div className="tab-content">
        {/* Score Summary */}
        <div className="score-summary">
          <div className="score-main">
            <span className="score-number">{result.score}</span>
            <span className="score-label">LARE-NW Score (half-bits)</span>
          </div>
          <div className="score-metrics">
            <div className="metric-card metric-identity">
              <span className="metric-value">{result.identity}%</span>
              <span className="metric-name">Identity</span>
            </div>
            <div className="metric-card metric-similarity">
              <span className="metric-value">{result.similarity}%</span>
              <span className="metric-name">Similarity</span>
            </div>
            <div className="metric-card metric-gaps">
              <span className="metric-value">{result.gap_pct}%</span>
              <span className="metric-name">Gaps</span>
            </div>
          </div>
        </div>

        {/* Identity Bar */}
        <div className="identity-bar-section">
          <div className="identity-bar-label">
            <span>Sequence Identity</span>
            <span>{result.identity}%</span>
          </div>
          <div className="identity-bar">
            <div
              className={`identity-bar-fill ${result.identity >= 60 ? 'high' : result.identity >= 30 ? 'medium' : 'low'}`}
              style={{ width: `${result.identity}%` }}
            ></div>
          </div>
        </div>

        {/* Substitution Breakdown - Stacked Bar */}
        <div className="breakdown-section">
          <h4>Substitution Classification (BLOSUM62)</h4>
          <div className="stacked-bar">
            {segs.map((s) => pct(s.count) > 0 && (
              <div
                key={s.key}
                className={`bar-segment ${s.cls}`}
                style={{ width: `${pct(s.count)}%` }}
                title={`${s.label}: ${s.count} (${pct(s.count).toFixed(1)}%)`}
              ></div>
            ))}
          </div>
          <div className="bar-legend">
            {segs.map((s) => (
              <span key={s.key} className="legend-item">
                <span className={`legend-color ${s.legend}`}></span>{s.label} ({s.count})
              </span>
            ))}
          </div>
        </div>

        {/* LARE-NW signature metrics */}
        <div className="breakdown-section">
          <h4>LARE-NW Relative-Entropy Metrics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{result.mean_psi}</span>
              <span className="stat-label">Mean Ψ (half-bits)</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{result.mean_entropy_seq1}</span>
              <span className="stat-label">Mean Entropy — Seq 1</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{result.mean_entropy_seq2}</span>
              <span className="stat-label">Mean Entropy — Seq 2</span>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{result.alignment_length}</span>
            <span className="stat-label">Alignment Length</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.matches}</span>
            <span className="stat-label">Matches</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.mismatches}</span>
            <span className="stat-label">Mismatches</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.gaps}</span>
            <span className="stat-label">Gaps</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.seq1_length}</span>
            <span className="stat-label">Seq 1 Length</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{result.seq2_length}</span>
            <span className="stat-label">Seq 2 Length</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">k={result.bandwidth_used}</span>
            <span className="stat-label">Bandwidth</span>
          </div>
        </div>

        {/* Performance & Parameters */}
        <div className="perf-params-row">
          <div className="perf-section">
            <h4>Performance</h4>
            <div className="perf-items">
              <span><strong>Runtime:</strong> {result.runtime_seconds}s</span>
              <span><strong>Peak Memory:</strong> {result.memory_peak_mb} MB</span>
            </div>
          </div>
          <div className="params-section">
            <h4>Parameters Used</h4>
            <div className="params-list">
              {result.params_used && Object.entries(result.params_used).map(([key, val]) => (
                <span key={key} className="param-tag">{key}={val}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === ALIGNMENT TAB ===
  const renderAlignment = () => {
    const aligned1 = result.aligned_seq1;
    const aligned2 = result.aligned_seq2;
    const blockSize = 60;
    const blocks = [];
    let runningPos1 = 0;
    let runningPos2 = 0;

    for (let i = 0; i < aligned1.length; i += blockSize) {
      const chunk1 = aligned1.slice(i, i + blockSize);
      const chunk2 = aligned2.slice(i, i + blockSize);
      const matchChars = [];
      const colored1 = [];
      const colored2 = [];

      const pos1Start = runningPos1;
      const pos2Start = runningPos2;

      for (let j = 0; j < chunk1.length; j++) {
        const c1 = chunk1[j];
        const c2 = chunk2[j];
        const posData = result.position_scores ? result.position_scores[i + j] : null;
        const category = posData ? posData.category : (c1 === '-' || c2 === '-' ? 'gap' : 'mismatch');

        const cls = CATEGORY_TO_CSS[category] || 'res-mismatch';
        matchChars.push(CATEGORY_TO_SYMBOL[category] || ' ');
        colored1.push(<span key={`1-${i + j}`} className={cls}>{c1}</span>);
        colored2.push(<span key={`2-${i + j}`} className={cls}>{c2}</span>);

        if (c1 !== '-') runningPos1++;
        if (c2 !== '-') runningPos2++;
      }

      const pos1End = runningPos1;
      const pos2End = runningPos2;

      blocks.push(
        <div key={i} className="alignment-block">
          <div className="alignment-row">
            <span className="alignment-label">Seq 1</span>
            <span className="alignment-pos">{pos1Start + 1}</span>
            <span className="alignment-seq">{colored1}</span>
            <span className="alignment-pos" style={{ marginLeft: '8px' }}>{pos1End}</span>
          </div>
          <div className="alignment-row">
            <span className="match-line">{matchChars.join('')}</span>
          </div>
          <div className="alignment-row">
            <span className="alignment-label">Seq 2</span>
            <span className="alignment-pos">{pos2Start + 1}</span>
            <span className="alignment-seq">{colored2}</span>
            <span className="alignment-pos" style={{ marginLeft: '8px' }}>{pos2End}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="tab-content">
        <div className="alignment-legend">
          <span className="legend-item"><span className="legend-color legend-identical"></span>Identical (|)</span>
          <span className="legend-item"><span className="legend-color legend-conservative"></span>Similar (:) BLOSUM62 &gt; 0</span>
          <span className="legend-item"><span className="legend-color legend-non-conservative"></span>Mismatch BLOSUM62 &le; 0</span>
          <span className="legend-item"><span className="legend-color legend-gap"></span>Gap</span>
        </div>
        <div className="alignment-viz">{blocks}</div>
        {result.position_scores_truncated && (
          <p className="chart-desc" style={{ marginTop: '8px', fontStyle: 'italic' }}>
            Per-column colouring shows the first {result.position_scores.length} of {result.alignment_length} columns; remaining columns are coloured by gap detection only.
          </p>
        )}
      </div>
    );
  };

  // === Ψ CORRECTION TAB ===
  const renderPsi = () => {
    const positions = (result.position_scores || []).filter((p) => p.psi !== null && p.psi !== undefined);
    // Most influential columns (largest |Ψ|).
    const ranked = [...positions].sort((a, b) => Math.abs(b.psi) - Math.abs(a.psi)).slice(0, 12);

    return (
      <div className="tab-content">
        <div className="chart-section">
          <h4>Ψ Relative-Entropy Correction (per match column)</h4>
          <p className="chart-desc">
            LARE-NW adjusts each BLOSUM62 match score by a position-specific term
            Ψ(i,j) = 2·[log₂(p_a/π_a(i)) + log₂(p_b/π_b(j))], where π is a Dirichlet-posterior
            estimate of <em>local</em> composition. <strong>Positive Ψ</strong> (blue, above the line) rewards matches in
            compositionally unusual contexts; <strong>negative Ψ</strong> (red, below) discounts matches in
            low-complexity or biased regions. Mean Ψ = {result.mean_psi} half-bits.
          </p>
          <PositionTrack points={positions.map((p) => ({ pos: p.pos, value: p.psi }))} mode="signed" />
          <div className="plot-x-label">Match column (N→C)</div>
        </div>

        <div className="chart-section">
          <h4>Most Influential Columns</h4>
          <p className="chart-desc">Columns where the local-composition correction most strongly altered the score.</p>
          <div className="ic-table">
            <div className="ic-header">
              <span className="ic-cell ic-aa">Col</span>
              <span className="ic-cell">Res 1 / Res 2</span>
              <span className="ic-cell">BLOSUM62</span>
              <span className="ic-cell">Ψ</span>
              <span className="ic-cell">Adjusted</span>
            </div>
            {ranked.map((p) => (
              <div key={p.pos} className="ic-row">
                <span className="ic-cell ic-aa">{p.pos}</span>
                <span className="ic-cell">{p.res1} / {p.res2}</span>
                <span className="ic-cell">{p.blosum62}</span>
                <span className={`ic-cell ${p.psi < 0 ? 'ic-diff-high' : ''}`}>{p.psi > 0 ? '+' : ''}{p.psi}</span>
                <span className="ic-cell">{(p.blosum62 + p.psi).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // === COMPLEXITY & GAPS TAB ===
  const renderComplexity = () => {
    return (
      <div className="tab-content">
        <div className="chart-section">
          <h4>Local Sequence Complexity (Normalized Shannon Entropy)</h4>
          <p className="chart-desc">
            Per-residue normalized entropy H_norm ∈ [0, 1] of the local composition window. Low values mark
            low-complexity / repetitive regions; high values mark compositionally diverse regions. This drives
            both the Ψ correction and the adaptive gap penalty.
          </p>
          <div className="lare-track-block">
            <span className="lare-track-name">Sequence 1</span>
            <PositionTrack points={result.entropy_seq1} mode="unsigned" color="#1565c0" />
          </div>
          <div className="lare-track-block">
            <span className="lare-track-name">Sequence 2</span>
            <PositionTrack points={result.entropy_seq2} mode="unsigned" color="#e65100" />
          </div>
          {result.entropy_truncated && (
            <p className="chart-desc" style={{ fontStyle: 'italic' }}>
              Long sequence — entropy track downsampled for display.
            </p>
          )}
        </div>

        <div className="chart-section">
          <h4>Entropy-Adaptive Gap-Open Penalty</h4>
          <p className="chart-desc">
            Position-specific gap-opening penalty G_open(i) = G_base·(1 + γ·H_norm(i)). Gaps are made
            <strong> cheaper</strong> (shorter bars) in low-complexity regions and <strong>costlier</strong> (taller bars)
            in high-entropy structured regions — instead of one flat gap cost.
          </p>
          <div className="lare-track-block">
            <span className="lare-track-name">Sequence 1</span>
            <PositionTrack
              points={result.gap_penalty_seq1.map((p) => ({ pos: p.pos, value: -p.value }))}
              mode="unsigned"
              color="#6a1b9a"
              formatValue={(v) => (-v).toFixed(2)}
            />
          </div>
          <div className="lare-track-block">
            <span className="lare-track-name">Sequence 2</span>
            <PositionTrack
              points={result.gap_penalty_seq2.map((p) => ({ pos: p.pos, value: -p.value }))}
              mode="unsigned"
              color="#6a1b9a"
              formatValue={(v) => (-v).toFixed(2)}
            />
          </div>
        </div>
      </div>
    );
  };

  // === REFERENCES TAB ===
  const renderReferences = () => {
    return (
      <div className="tab-content">
        <div className="ref-section">
          <h4>Algorithm Reference</h4>
          <div className="ref-card">
            <div className="ref-title">LARE-NW: Locally Adaptive Relative-Entropy Needleman-Wunsch</div>
            <div className="ref-desc">
              A global pairwise alignment algorithm that corrects BLOSUM62 substitution scores position-by-position
              using a Bayesian (Dirichlet-multinomial) estimate of local amino-acid composition, and modulates
              gap penalties by local sequence entropy. The dynamic program remains globally optimal because all
              position-dependent terms are precomputed before the banded Gotoh recursion.
            </div>
            <div className="ref-formula">
              <strong>Locally Corrected Match Score:</strong>
              <div className="formula">S_LARE(i,j) = BLOSUM62(a,b) + Ψ(i,j)</div>
              <div className="formula">Ψ(i,j) = 2·[log₂(p_a / π_a(i)) + log₂(p_b / π_b(j))]</div>
              <div className="formula">π_a(i) = (n_a(i) + α·p_a) / (|W_i| + α)</div>
              <div className="formula">G_open(i) = G_base·(1 + γ·H_norm(i))</div>
            </div>
            <div className="ref-components">
              <div className="ref-component">
                <strong>Ψ (Relative-Entropy Correction)</strong> &mdash; per-position log-odds of background vs. local
                posterior composition, in half-bit units. Rewards matches in unusual local contexts; discounts
                matches in low-complexity regions.
              </div>
              <div className="ref-component">
                <strong>π (Dirichlet posterior)</strong> &mdash; sliding-window posterior amino-acid frequencies with
                concentration α (default 20) and window half-width w (default 15), shrinking local counts toward the
                BLOSUM62-implicit background.
              </div>
              <div className="ref-component">
                <strong>Entropy-Adaptive Gaps</strong> &mdash; gap-opening penalty scales with normalized Shannon
                entropy H_norm via sensitivity γ (default 0.5), so gaps are cheaper in repetitive regions.
              </div>
              <div className="ref-component">
                <strong>BLOSUM62-implicit background (Yu &amp; Altschul, 2005)</strong> &mdash; the correct background
                frequencies for the Ψ decomposition, back-calculated from the integer BLOSUM62 matrix.
              </div>
              <div className="ref-component">
                <strong>Banded Gotoh DP</strong> &mdash; three-matrix affine-gap recursion restricted to a diagonal
                band, with Flouri et al. (2015) initialization, reducing memory to O(m·k).
              </div>
            </div>
          </div>
        </div>

        <div className="ref-section">
          <h4>Public Database Links</h4>
          <div className="db-links">
            <a href="https://www.uniprot.org/" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">UniProt</div>
              <div className="db-desc">Universal Protein Resource &mdash; comprehensive protein sequence and annotation database</div>
            </a>
            <a href="https://www.ncbi.nlm.nih.gov/protein/" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">NCBI Protein</div>
              <div className="db-desc">NCBI protein sequence database with BLAST search capabilities</div>
            </a>
            <a href="https://www.rcsb.org/" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">PDB (RCSB)</div>
              <div className="db-desc">Protein Data Bank &mdash; 3D structural data of biological macromolecules</div>
            </a>
            <a href="https://www.ebi.ac.uk/jdispatcher/psa/emboss_needle" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">EMBOSS Needle</div>
              <div className="db-desc">Reference Needleman-Wunsch global alignment service for comparison</div>
            </a>
            <a href="https://www.ebi.ac.uk/interpro/" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">InterPro</div>
              <div className="db-desc">Integrated database of protein families, domains and functional sites</div>
            </a>
            <a href="https://www.genome.jp/kegg/" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">KEGG</div>
              <div className="db-desc">Kyoto Encyclopedia of Genes and Genomes &mdash; pathway and function annotation</div>
            </a>
          </div>
        </div>

        <div className="ref-section">
          <h4>Related Literature</h4>
          <div className="ref-literature">
            <div className="lit-item">
              <span className="lit-authors">Needleman, S.B. &amp; Wunsch, C.D. (1970)</span>
              <span className="lit-title">A general method applicable to the search for similarities in the amino acid sequence of two proteins.</span>
              <span className="lit-journal">J. Mol. Biol., 48(3), 443-453.</span>
            </div>
            <div className="lit-item">
              <span className="lit-authors">Henikoff, S. &amp; Henikoff, J.G. (1992)</span>
              <span className="lit-title">Amino acid substitution matrices from protein blocks.</span>
              <span className="lit-journal">Proc. Natl. Acad. Sci. USA, 89(22), 10915-10919.</span>
            </div>
            <div className="lit-item">
              <span className="lit-authors">Yu, Y.K. &amp; Altschul, S.F. (2005)</span>
              <span className="lit-title">The construction of amino acid substitution matrices for the comparison of proteins with non-standard compositions.</span>
              <span className="lit-journal">Bioinformatics, 21(7), 902-911.</span>
            </div>
            <div className="lit-item">
              <span className="lit-authors">Flouri, T. et al. (2015)</span>
              <span className="lit-title">Are all global alignment algorithms and implementations correct?</span>
              <span className="lit-journal">bioRxiv, 10.1101/031500.</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="alignment-results">
      <div className="results-header">
        <span>LARE-NW Alignment Results</span>
        <div className="results-header-actions">
          <button className="export-btn" onClick={handleExportJSON}>Download JSON</button>
          <span className="results-score-badge">Score: {result.score}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="results-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`results-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="results-body">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'alignment' && renderAlignment()}
        {activeTab === 'psi' && renderPsi()}
        {activeTab === 'complexity' && renderComplexity()}
        {activeTab === 'references' && renderReferences()}
      </div>
    </div>
  );
}

export default AlignmentResults;
