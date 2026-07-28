import React, { useState } from 'react';
import { downloadJSON } from '../../utils/api';
import './VaccineResults.css';

const POP_LABELS = {
  caucasoid: 'Caucasoid',
  asian: 'East Asian',
  indian_subcontinent: 'Indian subcontinent',
  global: 'Global',
};

const METHOD_COLORS = { 'SA-BWK': '#6a1b9a', greedy: '#00838f', random: '#9e9e9e' };

const pct = (x) => `${(x * 100).toFixed(1)}%`;

function Bar({ value, max = 1, color = '#6a1b9a' }) {
  const w = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="vbar-track">
      <div className="vbar-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

// Hand-rolled SVG line chart for the SA-BWK convergence trajectory.
function Trajectory({ history }) {
  const pts = history.filter((h) => h.iter >= 0);
  if (pts.length < 2) return <div className="traj-empty">Trajectory unavailable (pool ≤ K).</div>;
  const W = 640;
  const H = 200;
  const pad = 34;
  const bests = pts.map((p) => p.best);
  const means = pts.map((p) => p.mean);
  const lo = Math.min(...means, ...bests);
  const hi = Math.max(...bests);
  const span = hi - lo || 1;
  const x = (i) => pad + (i / (pts.length - 1)) * (W - 2 * pad);
  const y = (v) => H - pad - ((v - lo) / span) * (H - 2 * pad);
  const line = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  return (
    <svg className="traj-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#ddd" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#ddd" />
      <path d={line(means)} fill="none" stroke="#bbb" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d={line(bests)} fill="none" stroke="#6a1b9a" strokeWidth="2.5" />
      <text x={pad} y={pad - 10} className="traj-label">best fitness {hi.toFixed(4)}</text>
      <text x={W - pad} y={H - pad + 20} className="traj-label" textAnchor="end">iteration {pts.length - 1}</text>
    </svg>
  );
}

function VaccineResults({ results }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!results || !results.construct || results.construct.length === 0) return null;

  const {
    construct, selected_by, fitness, methods, trajectory,
    population_coverage, pool, conservation_active, weights, population,
  } = results;

  const tabs = [
    { id: 'overview', label: 'Construct' },
    { id: 'coverage', label: 'Population Coverage' },
    { id: 'optimizer', label: 'Optimizer' },
    { id: 'references', label: 'References' },
  ];

  const maxAnt = Math.max(...construct.map((c) => c.antigenicity), 0.01);
  const maxCov = Math.max(...construct.map((c) => c.coverage), 0.01);

  // === CONSTRUCT / OVERVIEW ===
  const renderOverview = () => (
    <div className="tab-content">
      <div className="vaccine-summary">
        <div className="vsum-main">
          <span className="vsum-fitness">{fitness.fitness.toFixed(4)}</span>
          <span className="vsum-fitness-label">Construct Fitness</span>
          <span className="selected-by-badge" style={{ background: METHOD_COLORS[selected_by] || '#6a1b9a' }}>
            selected by {selected_by}
          </span>
        </div>
        <div className="vsum-cards">
          <div className="vsum-card">
            <span className="vsum-card-val">{pct(fitness.mean_antigenicity)}</span>
            <span className="vsum-card-lbl">Mean antigenicity</span>
          </div>
          <div className="vsum-card">
            <span className="vsum-card-val">{conservation_active ? pct(fitness.min_conservation) : '—'}</span>
            <span className="vsum-card-lbl">Min conservation {conservation_active ? '' : '(inactive)'}</span>
          </div>
          <div className="vsum-card">
            <span className="vsum-card-val">{pct(fitness.joint_coverage)}</span>
            <span className="vsum-card-lbl">Joint HLA coverage</span>
          </div>
          <div className="vsum-card">
            <span className="vsum-card-val">{fitness.unique_alleles}</span>
            <span className="vsum-card-lbl">Unique alleles bound</span>
          </div>
          <div className="vsum-card">
            <span className="vsum-card-val">{fitness.redundancy.toFixed(3)}</span>
            <span className="vsum-card-lbl">Redundancy (3-mer)</span>
          </div>
        </div>
      </div>

      <h3 className="section-title">Selected Construct ({construct.length} peptides)</h3>
      <div className="construct-table-wrap">
        <table className="construct-table">
          <thead>
            <tr>
              <th>#</th><th>Peptide</th><th>Len</th><th>Antigenicity</th>
              <th>Conservation</th><th>Coverage</th><th>Binders</th><th>Drug.</th>
            </tr>
          </thead>
          <tbody>
            {construct.map((c, i) => (
              <tr key={c.peptide}>
                <td>{i + 1}</td>
                <td className="mono">{c.peptide}</td>
                <td>{c.length}</td>
                <td>
                  <div className="cell-bar-row">
                    <Bar value={c.antigenicity} max={maxAnt} color="#c62828" />
                    <span className="cell-num">{c.antigenicity.toFixed(3)}</span>
                  </div>
                </td>
                <td>{conservation_active ? c.conservation.toFixed(3) : '—'}</td>
                <td>
                  <div className="cell-bar-row">
                    <Bar value={c.coverage} max={maxCov} color="#00838f" />
                    <span className="cell-num">{c.coverage.toFixed(3)}</span>
                  </div>
                </td>
                <td>{c.n_binders}</td>
                <td>{c.druggable ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pool-summary">
        Pool: {pool.submitted} submitted → {pool.valid} valid →
        {' '}{pool.filtered_out > 0 ? `${pool.filtered_out} filtered out → ` : ''}
        {pool.pool_size} optimised → {pool.k} selected.
        {pool.filter_fell_back && ' (Filters left too few candidates, so the unfiltered pool was used.)'}
      </div>
    </div>
  );

  // === COVERAGE ===
  const renderCoverage = () => {
    const pops = Object.keys(population_coverage);
    return (
      <div className="tab-content">
        <h3 className="section-title">Population Coverage of the Construct</h3>
        <div className="pop-cov-chart">
          {pops.map((p) => (
            <div className="pop-cov-row" key={p}>
              <span className={`pop-cov-label ${p === population ? 'target' : ''}`}>
                {POP_LABELS[p] || p}{p === population ? ' (target)' : ''}
              </span>
              <div className="pop-cov-bar-container">
                <div className="pop-cov-bar" style={{ width: pct(population_coverage[p]) }} />
              </div>
              <span className="pop-cov-value">{pct(population_coverage[p])}</span>
            </div>
          ))}
        </div>
        <p className="vnote">
          Fraction of each population predicted to carry at least one HLA class-I allele
          that presents a peptide in the construct (IEDB Hardy-Weinberg model over the
          union of bound alleles). Binding predicted by a conservative anchor-motif model.
        </p>

        <h3 className="section-title">Per-Peptide Coverage &amp; Binders</h3>
        <div className="construct-table-wrap">
          <table className="construct-table">
            <thead><tr><th>Peptide</th><th>Coverage</th><th>Bound HLA alleles</th></tr></thead>
            <tbody>
              {construct.map((c) => (
                <tr key={c.peptide}>
                  <td className="mono">{c.peptide}</td>
                  <td>{pct(c.coverage)}</td>
                  <td className="alleles-cell">{c.binders.length ? c.binders.join(', ') : <span className="muted">none predicted</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // === OPTIMIZER ===
  const renderOptimizer = () => {
    const rows = [
      { name: 'SA-BWK', val: methods.sabwk, color: METHOD_COLORS['SA-BWK'] },
      { name: 'Greedy', val: methods.greedy, color: METHOD_COLORS.greedy },
      { name: 'Random (best)', val: methods.random_best, color: METHOD_COLORS.random },
      { name: 'Random (mean)', val: methods.random_mean, color: '#cfcfcf' },
    ];
    const maxV = Math.max(...rows.map((r) => r.val), 0.01);
    const minV = Math.min(...rows.map((r) => r.val));
    const floor = Math.max(0, minV - 0.05);
    return (
      <div className="tab-content">
        <h3 className="section-title">Optimizer Comparison</h3>
        <div className="method-chart">
          {rows.map((r) => (
            <div className="method-row" key={r.name}>
              <span className="method-label">{r.name}</span>
              <div className="method-bar-container">
                <div className="method-bar"
                  style={{
                    width: `${((r.val - floor) / (maxV - floor || 1)) * 100}%`,
                    background: r.color,
                  }} />
              </div>
              <span className="method-value">{r.val.toFixed(4)}</span>
            </div>
          ))}
        </div>
        <p className="vnote">
          SA-BWK is greedy-seeded, so it is guaranteed to match or beat greedy. Winner:{' '}
          <strong>{selected_by}</strong>.
        </p>

        <h3 className="section-title">SA-BWK Convergence</h3>
        <Trajectory history={trajectory || []} />
        <div className="traj-legend">
          <span><span className="traj-swatch best" /> best fitness</span>
          <span><span className="traj-swatch mean" /> population mean</span>
        </div>

        <div className="weights-readout">
          Fitness weights — antigenicity {weights.antigenicity}, conservation{' '}
          {weights.conservation}, coverage {weights.coverage}; redundancy penalty 0.15.
        </div>
      </div>
    );
  };

  // === REFERENCES ===
  const renderReferences = () => (
    <div className="tab-content">
      <h3 className="section-title">References &amp; Methods</h3>
      <div className="ref-list">
        <div className="ref-item"><span className="ref-number">1.</span><div className="ref-text">
          <strong>SA-BWK optimiser:</strong> discrete Self-improved Black-Winged Kite Algorithm
          (after Wang et al. 2024), adapted to K-subset selection with opposition-based
          initialisation, adaptive diversification, and greedy warm-start (Objective 3).
        </div></div>
        <div className="ref-item"><span className="ref-number">2.</span><div className="ref-text">
          <strong>Antigenicity:</strong> MLPT-LARE (Objective 2) — the platform's Antigenic
          Peptide Predictor gives P(antigenic) per candidate.
        </div></div>
        <div className="ref-item"><span className="ref-number">3.</span><div className="ref-text">
          <strong>Conservation:</strong> LARE-NW (Objective 1) Bayesian posterior enrichment,
          hybridised with BLOSUM62 similarity across the supplied reference variants.
        </div></div>
        <div className="ref-item"><span className="ref-number">4.</span><div className="ref-text">
          <strong>HLA coverage:</strong> IEDB population-coverage model (Bui et al. 2006) over
          Allele Frequency Net Database frequencies (Gonzalez-Galarza et al. 2020); anchor-motif
          binding after Rammensee SYFPEITHI.
        </div></div>
        <div className="ref-item"><span className="ref-number">5.</span><div className="ref-text">
          <strong>Druggability:</strong> cysteine, Guruprasad (1990) instability index, and
          Kyte-Doolittle GRAVY constraints.
        </div></div>
      </div>
    </div>
  );

  const renderActive = () => ({
    overview: renderOverview, coverage: renderCoverage,
    optimizer: renderOptimizer, references: renderReferences,
  }[activeTab] || renderOverview)();

  return (
    <div className="vaccine-results">
      <div className="results-header">
        <h2>Vaccine Construct</h2>
        <div className="results-header-actions">
          <button className="export-btn" onClick={() => downloadJSON(results, 'vaccine-construct')}>
            Download JSON
          </button>
        </div>
      </div>
      <div className="results-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`results-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="results-body">{renderActive()}</div>
    </div>
  );
}

export default VaccineResults;
