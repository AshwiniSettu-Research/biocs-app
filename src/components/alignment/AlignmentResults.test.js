import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlignmentResults from './AlignmentResults';
import * as api from '../../utils/api';

// ---------------------------------------------------------------------------
// Mock CSS import
// ---------------------------------------------------------------------------
jest.mock('./AlignmentResults.css', () => {});

// ---------------------------------------------------------------------------
// Mock downloadJSON so we can assert it was called
// ---------------------------------------------------------------------------
jest.mock('../../utils/api', () => ({
  downloadJSON: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Realistic fixture data matching the actual API response shape
// ---------------------------------------------------------------------------
const RESULTS_FIXTURE = [
  {
    score: 112.5,
    identity: 42.0,
    alignment_length: 52,
    matches: 22,
    mismatches: 28,
    gaps: 2,
    gap_opens: 1,
    seq1_length: 50,
    seq2_length: 50,
    bandwidth_used: 5,
    runtime_seconds: 0.023,
    memory_peak_mb: 1.2,
    aligned_seq1: 'MVLSPADKTN',
    aligned_seq2: 'MVHLTPEEKS',
    position_scores: [
      { pos: 1, res1: 'M', res2: 'M', blosum62: 5, category: 'identical' },
      { pos: 2, res1: 'V', res2: 'V', blosum62: 4, category: 'identical' },
      { pos: 3, res1: 'L', res2: 'H', blosum62: -3, category: 'non_conservative' },
      { pos: 4, res1: 'S', res2: 'L', blosum62: -2, category: 'non_conservative' },
      { pos: 5, res1: 'P', res2: 'T', blosum62: -1, category: 'non_conservative' },
      { pos: 6, res1: 'A', res2: 'P', blosum62: -1, category: 'non_conservative' },
      { pos: 7, res1: 'D', res2: 'E', blosum62: 2, category: 'conservative' },
      { pos: 8, res1: 'K', res2: 'E', blosum62: 1, category: 'semi_conservative' },
      { pos: 9, res1: 'T', res2: 'K', blosum62: -1, category: 'non_conservative' },
      { pos: 10, res1: 'N', res2: 'S', blosum62: 1, category: 'semi_conservative' },
    ],
    position_scores_truncated: false,
    scoring_breakdown: {
      identical: 22,
      identical_pct: 42.3,
      conservative: 8,
      conservative_pct: 15.4,
      semi_conservative: 6,
      semi_conservative_pct: 11.5,
      non_conservative: 14,
      non_conservative_pct: 26.9,
      gaps: 2,
      gap_pct: 3.8,
      similarity_pct: 69.2,
    },
    params_used: {
      alpha: 0.5,
      beta: 0.3,
      gap_open: -10.0,
      gap_extend: -1.0,
      bandwidth: 5,
    },
    compositional_analysis: {
      seq1_aac: { A: 0.12, D: 0.04, E: 0.06, G: 0.08, K: 0.1, L: 0.08, M: 0.02 },
      seq2_aac: { A: 0.06, D: 0.02, E: 0.1, G: 0.06, K: 0.08, L: 0.1, M: 0.02 },
      seq1_ic: { A: 3.06, D: 4.64, E: 4.06, G: 3.64, K: 3.32, L: 3.64, M: 5.64 },
      seq2_ic: { A: 4.06, D: 5.64, E: 3.32, G: 4.06, K: 3.64, L: 3.32, M: 5.64 },
      seq1_dpc_top: { PA: 0.04, AD: 0.03, DK: 0.03, KT: 0.03, TN: 0.03 },
      seq2_dpc_top: { PE: 0.04, EE: 0.03, EK: 0.03, KS: 0.03, LT: 0.03 },
    },
    conservation_plot: [
      { position: 1, identity: 100 },
      { position: 2, identity: 80 },
      { position: 3, identity: 40 },
      { position: 4, identity: 20 },
      { position: 5, identity: 60 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AlignmentResults', () => {
  it('renders null when results is null', () => {
    const { container } = render(<AlignmentResults results={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders null when results is an empty array', () => {
    const { container } = render(<AlignmentResults results={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the overview tab by default with score and identity', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    // Header
    expect(screen.getByText(/CM-BLOSUM-NW Alignment Results/i)).toBeInTheDocument();
    expect(screen.getByText('Score: 112.5')).toBeInTheDocument();

    // Overview metrics
    expect(screen.getByText('112.5')).toBeInTheDocument(); // score number
    expect(screen.getByText('Alignment Score')).toBeInTheDocument();

    // Identity shown
    const identityElements = screen.getAllByText('42%');
    expect(identityElements.length).toBeGreaterThanOrEqual(1);

    // Stats grid
    expect(screen.getByText('Alignment Length')).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('switches to the Pairwise Alignment tab and renders alignment visualization', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /pairwise alignment/i }));

    // Should show the alignment legend
    expect(screen.getByText(/Identical \(\|\)/)).toBeInTheDocument();

    // Should render Seq 1 / Seq 2 labels
    const seq1Labels = screen.getAllByText('Seq 1');
    expect(seq1Labels.length).toBeGreaterThanOrEqual(1);
    const seq2Labels = screen.getAllByText('Seq 2');
    expect(seq2Labels.length).toBeGreaterThanOrEqual(1);
  });

  it('switches to the Compositional Analysis tab', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /compositional analysis/i }));

    expect(screen.getByText(/Amino Acid Composition/)).toBeInTheDocument();
    expect(screen.getByText(/Information Content/)).toBeInTheDocument();
    expect(screen.getByText(/Top Dipeptide Frequencies/)).toBeInTheDocument();
  });

  it('switches to the Conservation & Scoring tab', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /conservation/i }));

    expect(screen.getByText(/Conservation Profile/)).toBeInTheDocument();
    expect(screen.getByText(/Per-Position BLOSUM62 Score Heatmap/)).toBeInTheDocument();
  });

  it('switches to the Database References tab', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /database references/i }));

    expect(screen.getByText('Algorithm Reference')).toBeInTheDocument();
    expect(screen.getByText('Public Database Links')).toBeInTheDocument();
    expect(screen.getByText('UniProt')).toBeInTheDocument();
  });

  it('calls downloadJSON when the export button is clicked', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /download json/i }));

    expect(api.downloadJSON).toHaveBeenCalledTimes(1);
    expect(api.downloadJSON).toHaveBeenCalledWith(
      RESULTS_FIXTURE[0],
      'cm-blosum-nw-alignment',
    );
  });

  it('renders alignment visualization with colored position scores', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    // Switch to alignment tab
    fireEvent.click(screen.getByRole('button', { name: /pairwise alignment/i }));

    // Check that residue characters from the aligned sequences are rendered
    // The first two residues are M and V (identical)
    const allSpans = document.querySelectorAll('.res-match');
    expect(allSpans.length).toBeGreaterThan(0);
  });

  it('renders performance and parameter information in overview', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText(/0.023s/)).toBeInTheDocument();
    expect(screen.getByText(/1.2 MB/)).toBeInTheDocument();
    expect(screen.getByText('Parameters Used')).toBeInTheDocument();
  });
});
