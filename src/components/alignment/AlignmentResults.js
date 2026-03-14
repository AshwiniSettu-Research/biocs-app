import React, { useState } from 'react';
import { downloadJSON } from '../../utils/api';
import './AlignmentResults.css';

const CATEGORY_TO_CSS = {
  identical: 'res-match',
  conservative: 'res-conservative',
  semi_conservative: 'res-semi',
  non_conservative: 'res-mismatch',
  gap: 'res-gap',
};

const CATEGORY_TO_SYMBOL = {
  identical: '|',
  conservative: ':',
  semi_conservative: '.',
  non_conservative: ' ',
  gap: ' ',
};

function AlignmentResults({ results }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!results || results.length === 0) return null;
  const result = results[0]; // CM-BLOSUM-NW only

  const handleExportJSON = () => {
    downloadJSON(result, 'cm-blosum-nw-alignment');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'alignment', label: 'Pairwise Alignment' },
    { id: 'composition', label: 'Compositional Analysis' },
    { id: 'conservation', label: 'Conservation & Scoring' },
    { id: 'references', label: 'Database References' },
  ];

  // === OVERVIEW TAB ===
  const renderOverview = () => {
    const bd = result.scoring_breakdown || {};
    return (
      <div className="tab-content">
        {/* Score Summary */}
        <div className="score-summary">
          <div className="score-main">
            <span className="score-number">{result.score}</span>
            <span className="score-label">Alignment Score</span>
          </div>
          <div className="score-metrics">
            <div className="metric-card metric-identity">
              <span className="metric-value">{result.identity}%</span>
              <span className="metric-name">Identity</span>
            </div>
            <div className="metric-card metric-similarity">
              <span className="metric-value">{bd.similarity_pct || 0}%</span>
              <span className="metric-name">Similarity</span>
            </div>
            <div className="metric-card metric-gaps">
              <span className="metric-value">{bd.gap_pct || 0}%</span>
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
            {bd.identical_pct > 0 && (
              <div className="bar-segment bar-identical" style={{ width: `${bd.identical_pct}%` }}
                title={`Identical: ${bd.identical} (${bd.identical_pct}%)`}></div>
            )}
            {bd.conservative_pct > 0 && (
              <div className="bar-segment bar-conservative" style={{ width: `${bd.conservative_pct}%` }}
                title={`Conservative: ${bd.conservative} (${bd.conservative_pct}%)`}></div>
            )}
            {bd.semi_conservative_pct > 0 && (
              <div className="bar-segment bar-semi" style={{ width: `${bd.semi_conservative_pct}%` }}
                title={`Semi-conservative: ${bd.semi_conservative} (${bd.semi_conservative_pct}%)`}></div>
            )}
            {bd.non_conservative_pct > 0 && (
              <div className="bar-segment bar-non-conservative" style={{ width: `${bd.non_conservative_pct}%` }}
                title={`Non-conservative: ${bd.non_conservative} (${bd.non_conservative_pct}%)`}></div>
            )}
            {bd.gap_pct > 0 && (
              <div className="bar-segment bar-gap" style={{ width: `${bd.gap_pct}%` }}
                title={`Gaps: ${bd.gaps} (${bd.gap_pct}%)`}></div>
            )}
          </div>
          <div className="bar-legend">
            <span className="legend-item"><span className="legend-color legend-identical"></span>Identical ({bd.identical})</span>
            <span className="legend-item"><span className="legend-color legend-conservative"></span>Conservative ({bd.conservative})</span>
            <span className="legend-item"><span className="legend-color legend-semi"></span>Semi-conservative ({bd.semi_conservative})</span>
            <span className="legend-item"><span className="legend-color legend-non-conservative"></span>Non-conservative ({bd.non_conservative})</span>
            <span className="legend-item"><span className="legend-color legend-gap"></span>Gaps ({bd.gaps})</span>
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
            <span className="stat-value">{result.gap_opens}</span>
            <span className="stat-label">Gap Opens</span>
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
        const category = posData ? posData.category : (c1 === '-' || c2 === '-' ? 'gap' : 'non_conservative');

        const cls = CATEGORY_TO_CSS[category] || 'res-mismatch';
        matchChars.push(CATEGORY_TO_SYMBOL[category] || ' ');
        colored1.push(<span key={`1-${i+j}`} className={cls}>{c1}</span>);
        colored2.push(<span key={`2-${i+j}`} className={cls}>{c2}</span>);

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
          <span className="legend-item"><span className="legend-color legend-conservative"></span>Conservative (:) BLOSUM62 &ge; 1</span>
          <span className="legend-item"><span className="legend-color legend-semi"></span>Semi-conservative (.) BLOSUM62 &ge; 0</span>
          <span className="legend-item"><span className="legend-color legend-non-conservative"></span>Non-conservative BLOSUM62 &lt; 0</span>
          <span className="legend-item"><span className="legend-color legend-gap"></span>Gap</span>
        </div>
        <div className="alignment-viz">{blocks}</div>
      </div>
    );
  };

  // === COMPOSITION TAB ===
  const renderComposition = () => {
    const comp = result.compositional_analysis;
    if (!comp) return <div className="tab-content"><p>No compositional data available.</p></div>;

    const aacData = [];
    const allAA = Object.keys(comp.seq1_aac || {}).sort();
    allAA.forEach(aa => {
      aacData.push({
        aa,
        seq1: (comp.seq1_aac[aa] || 0) * 100,
        seq2: (comp.seq2_aac[aa] || 0) * 100,
      });
    });

    const maxAAC = Math.max(...aacData.map(d => Math.max(d.seq1, d.seq2)), 1);

    // IC data
    const icData = [];
    allAA.forEach(aa => {
      if ((comp.seq1_ic && comp.seq1_ic[aa]) || (comp.seq2_ic && comp.seq2_ic[aa])) {
        icData.push({
          aa,
          seq1: comp.seq1_ic ? comp.seq1_ic[aa] : 0,
          seq2: comp.seq2_ic ? comp.seq2_ic[aa] : 0,
        });
      }
    });

    return (
      <div className="tab-content">
        {/* AAC Bar Chart */}
        <div className="chart-section">
          <h4>Amino Acid Composition (%)</h4>
          <p className="chart-desc">Frequency of each amino acid in both input sequences. Compositional bias reveals evolutionary and functional characteristics.</p>
          <div className="bar-chart">
            {aacData.map(d => (
              <div key={d.aa} className="bar-group">
                <div className="bar-pair">
                  <div className="bar bar-seq1" style={{ height: `${(d.seq1 / maxAAC) * 120}px` }}
                    title={`Seq 1: ${d.seq1.toFixed(1)}%`}></div>
                  <div className="bar bar-seq2" style={{ height: `${(d.seq2 / maxAAC) * 120}px` }}
                    title={`Seq 2: ${d.seq2.toFixed(1)}%`}></div>
                </div>
                <span className="bar-label">{d.aa}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color" style={{ background: '#1565c0' }}></span>Sequence 1</span>
            <span className="legend-item"><span className="legend-color" style={{ background: '#e65100' }}></span>Sequence 2</span>
          </div>
        </div>

        {/* Information Content */}
        <div className="chart-section">
          <h4>Information Content (bits)</h4>
          <p className="chart-desc">IC = -log2(freq). Higher IC indicates rarer amino acids, which contribute more to the CM-BLOSUM-NW scoring via the &alpha; parameter.</p>
          <div className="ic-table">
            <div className="ic-header">
              <span className="ic-cell ic-aa">AA</span>
              <span className="ic-cell">Seq 1 IC</span>
              <span className="ic-cell">Seq 2 IC</span>
              <span className="ic-cell">Difference</span>
            </div>
            {icData.filter(d => d.seq1 < 18 || d.seq2 < 18).map(d => (
              <div key={d.aa} className="ic-row">
                <span className="ic-cell ic-aa">{d.aa}</span>
                <span className="ic-cell">{d.seq1.toFixed(2)}</span>
                <span className="ic-cell">{d.seq2.toFixed(2)}</span>
                <span className={`ic-cell ${Math.abs(d.seq1 - d.seq2) > 2 ? 'ic-diff-high' : ''}`}>
                  {(d.seq1 - d.seq2).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dipeptide Composition */}
        <div className="chart-section">
          <h4>Top Dipeptide Frequencies</h4>
          <p className="chart-desc">Most frequent dipeptides in each sequence. DPC modulation (weighted by &beta;) captures local sequence context beyond single amino acids.</p>
          <div className="dpc-comparison">
            <div className="dpc-column">
              <h5>Sequence 1</h5>
              {comp.seq1_dpc_top && Object.entries(comp.seq1_dpc_top).slice(0, 10).map(([dp, freq]) => (
                <div key={dp} className="dpc-item">
                  <span className="dpc-name">{dp}</span>
                  <div className="dpc-bar-container">
                    <div className="dpc-bar dpc-bar-seq1" style={{ width: `${freq * 100 * 5}%` }}></div>
                  </div>
                  <span className="dpc-value">{(freq * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="dpc-column">
              <h5>Sequence 2</h5>
              {comp.seq2_dpc_top && Object.entries(comp.seq2_dpc_top).slice(0, 10).map(([dp, freq]) => (
                <div key={dp} className="dpc-item">
                  <span className="dpc-name">{dp}</span>
                  <div className="dpc-bar-container">
                    <div className="dpc-bar dpc-bar-seq2" style={{ width: `${freq * 100 * 5}%` }}></div>
                  </div>
                  <span className="dpc-value">{(freq * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === CONSERVATION TAB ===
  const renderConservation = () => {
    const positions = result.position_scores || [];
    const plotData = result.conservation_plot || [];

    const getHeatColor = (score) => {
      if (score === null) return '#e0e0e0';
      if (score >= 4) return '#1b5e20';
      if (score >= 2) return '#43a047';
      if (score >= 1) return '#66bb6a';
      if (score >= 0) return '#fff9c4';
      if (score >= -1) return '#ffcc80';
      if (score >= -2) return '#ef9a9a';
      return '#c62828';
    };

    return (
      <div className="tab-content">
        {/* Sliding Window Conservation Plot */}
        {plotData.length > 0 && (
          <div className="chart-section">
            <h4>Conservation Profile (Sliding Window)</h4>
            <p className="chart-desc">Local identity percentage computed over a sliding window. Peaks indicate conserved regions; troughs indicate divergent or gap-rich segments.</p>
            <div className="conservation-plot">
              <div className="plot-y-axis">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>
              <div className="plot-area">
                {plotData.map((point, i) => (
                  <div
                    key={i}
                    className="plot-bar"
                    style={{ height: `${point.identity}%` }}
                    title={`Position ${point.position}: ${point.identity}% identity`}
                  ></div>
                ))}
              </div>
            </div>
            <div className="plot-x-label">Alignment Position</div>
          </div>
        )}

        {/* Per-Position BLOSUM62 Heatmap */}
        <div className="chart-section">
          <h4>Per-Position BLOSUM62 Score Heatmap</h4>
          <p className="chart-desc">BLOSUM62 substitution score at each alignment position. Green = favorable substitution, yellow = neutral, red = unfavorable, grey = gap.</p>
          <div className="heatmap-container">
            <div className="heatmap-row">
              {positions.map((p, i) => (
                <div
                  key={i}
                  className="heatmap-cell"
                  style={{ backgroundColor: getHeatColor(p.blosum62) }}
                  title={`Pos ${p.pos}: ${p.res1}/${p.res2} = ${p.blosum62 !== null ? p.blosum62 : 'gap'}`}
                >
                  <span className="heatmap-res">{p.res1}</span>
                </div>
              ))}
            </div>
            <div className="heatmap-row">
              {positions.map((p, i) => (
                <div
                  key={i}
                  className="heatmap-cell"
                  style={{ backgroundColor: getHeatColor(p.blosum62) }}
                >
                  <span className="heatmap-res">{p.res2}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="heatmap-legend">
            <span className="heatmap-legend-label">Score:</span>
            <div className="heatmap-gradient">
              <span style={{ background: '#c62828' }}>&le;-3</span>
              <span style={{ background: '#ef9a9a' }}>-2</span>
              <span style={{ background: '#ffcc80' }}>-1</span>
              <span style={{ background: '#fff9c4' }}>0</span>
              <span style={{ background: '#66bb6a' }}>1-2</span>
              <span style={{ background: '#43a047' }}>3-4</span>
              <span style={{ background: '#1b5e20' }}>&ge;5</span>
              <span style={{ background: '#e0e0e0' }}>Gap</span>
            </div>
          </div>
          {result.position_scores_truncated && (
            <p className="chart-desc" style={{ marginTop: '8px', fontStyle: 'italic' }}>
              Heatmap shows first 500 of {result.alignment_length} positions. See Pairwise Alignment tab for full visualization.
            </p>
          )}
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
            <div className="ref-title">CM-BLOSUM-NW: Compositionally Modulated BLOSUM Needleman-Wunsch</div>
            <div className="ref-desc">
              This tool implements a novel pairwise sequence alignment algorithm that enhances
              the standard Needleman-Wunsch dynamic programming approach with compositional
              modulation of the BLOSUM62 substitution matrix.
            </div>
            <div className="ref-formula">
              <strong>Hybrid Scoring Formula:</strong>
              <div className="formula">M(a,b) = BLOSUM62(a,b) + &alpha; &middot; IC(a,b) + &beta; &middot; DPC(a,b)</div>
            </div>
            <div className="ref-components">
              <div className="ref-component">
                <strong>BLOSUM62</strong> &mdash; Blocks Substitution Matrix derived from observed amino acid substitutions in conserved protein blocks (Henikoff &amp; Henikoff, 1992).
              </div>
              <div className="ref-component">
                <strong>IC (Information Content)</strong> &mdash; Measures the rarity of amino acids based on sequence composition. IC(a) = -log2(freq(a)). Rare residue matches receive higher scores.
              </div>
              <div className="ref-component">
                <strong>DPC (Dipeptide Composition)</strong> &mdash; Log-odds ratio of observed dipeptide frequency vs. expected from individual amino acid frequencies. Captures local sequence context.
              </div>
              <div className="ref-component">
                <strong>Affine Gap Penalties</strong> &mdash; Gotoh (1982) model with separate gap-open and gap-extend costs, implemented via three DP matrices (M, X, Y).
              </div>
              <div className="ref-component">
                <strong>Banded DP</strong> &mdash; Restricts computation to a diagonal band of width 2k+1, reducing time complexity from O(mn) to O(m&middot;k).
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
            <a href="https://pfam.xfam.org/" target="_blank" rel="noopener noreferrer" className="db-link-card">
              <div className="db-name">Pfam</div>
              <div className="db-desc">Protein families database with HMM-based domain classification</div>
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
              <span className="lit-authors">Gotoh, O. (1982)</span>
              <span className="lit-title">An improved algorithm for matching biological sequences.</span>
              <span className="lit-journal">J. Mol. Biol., 162(3), 705-708.</span>
            </div>
            <div className="lit-item">
              <span className="lit-authors">Henikoff, S. &amp; Henikoff, J.G. (1992)</span>
              <span className="lit-title">Amino acid substitution matrices from protein blocks.</span>
              <span className="lit-journal">Proc. Natl. Acad. Sci. USA, 89(22), 10915-10919.</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="alignment-results">
      <div className="results-header">
        <span>CM-BLOSUM-NW Alignment Results</span>
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
        {activeTab === 'composition' && renderComposition()}
        {activeTab === 'conservation' && renderConservation()}
        {activeTab === 'references' && renderReferences()}
      </div>
    </div>
  );
}

export default AlignmentResults;
