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
// Realistic LARE-NW fixture matching the actual /api/align response shape.
// One entry in the `results` array represents a single pairwise alignment.
// ---------------------------------------------------------------------------
const RESULTS_FIXTURE = [
  {
    algorithm: 'LARE-NW',
    aligned_seq1: 'MVLSPADKTN',
    aligned_seq2: 'MV-HTPEEKS',
    score: 112.5,
    alignment_length: 10,
    identity: 30.0,
    matches: 3,
    mismatches: 6,
    similarity: 50.0,
    similarity_count: 5,
    gaps: 1,
    gap_pct: 10.0,
    mean_psi: 1.42,
    mean_entropy_seq1: 0.81,
    mean_entropy_seq2: 0.76,
    bandwidth_used: 5,
    runtime_seconds: 0.023,
    memory_peak_mb: 1.2,
    seq1_length: 9,
    seq2_length: 9,
    params_used: {
      alpha: 20,
      w: 15,
      gamma: 0.5,
      g_base: -10.0,
      g_ext: -1.0,
      bandwidth: 5,
    },
    position_scores: [
      { pos: 1, res1: 'M', res2: 'M', blosum62: 5, psi: 1.2, category: 'identical' },
      { pos: 2, res1: 'V', res2: 'V', blosum62: 4, psi: 0.8, category: 'identical' },
      { pos: 3, res1: 'L', res2: '-', blosum62: null, psi: null, category: 'gap' },
      { pos: 4, res1: 'S', res2: 'H', blosum62: -1, psi: -0.5, category: 'mismatch' },
      { pos: 5, res1: 'P', res2: 'T', blosum62: -1, psi: 2.3, category: 'mismatch' },
      { pos: 6, res1: 'A', res2: 'P', blosum62: -1, psi: -1.1, category: 'mismatch' },
      { pos: 7, res1: 'D', res2: 'E', blosum62: 2, psi: 1.9, category: 'similar' },
      { pos: 8, res1: 'K', res2: 'E', blosum62: 1, psi: 0.4, category: 'similar' },
      { pos: 9, res1: 'T', res2: 'K', blosum62: -1, psi: -0.3, category: 'mismatch' },
      { pos: 10, res1: 'N', res2: 'S', blosum62: 1, psi: 3.1, category: 'similar' },
    ],
    position_scores_truncated: false,
    entropy_seq1: [
      { pos: 1, value: 0.92 },
      { pos: 2, value: 0.88 },
      { pos: 3, value: 0.75 },
      { pos: 4, value: 0.61 },
      { pos: 5, value: 0.83 },
    ],
    entropy_seq2: [
      { pos: 1, value: 0.81 },
      { pos: 2, value: 0.79 },
      { pos: 3, value: 0.66 },
      { pos: 4, value: 0.7 },
      { pos: 5, value: 0.85 },
    ],
    entropy_truncated: false,
    gap_penalty_seq1: [
      { pos: 1, value: -14.6 },
      { pos: 2, value: -14.4 },
      { pos: 3, value: -13.7 },
      { pos: 4, value: -13.0 },
      { pos: 5, value: -14.1 },
    ],
    gap_penalty_seq2: [
      { pos: 1, value: -14.0 },
      { pos: 2, value: -13.9 },
      { pos: 3, value: -13.3 },
      { pos: 4, value: -13.5 },
      { pos: 5, value: -14.2 },
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
    expect(screen.getByText(/LARE-NW Alignment Results/i)).toBeInTheDocument();
    expect(screen.getByText('Score: 112.5')).toBeInTheDocument();

    // Overview score block
    expect(screen.getByText('112.5')).toBeInTheDocument(); // score number
    expect(screen.getByText(/LARE-NW Score \(half-bits\)/i)).toBeInTheDocument();

    // Identity shown (metric card + identity bar label both render "30%")
    const identityElements = screen.getAllByText('30%');
    expect(identityElements.length).toBeGreaterThanOrEqual(1);

    // Stats grid
    expect(screen.getByText('Alignment Length')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
  });

  it('renders LARE-NW relative-entropy metrics in overview', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    expect(screen.getByText(/LARE-NW Relative-Entropy Metrics/i)).toBeInTheDocument();
    expect(screen.getByText('1.42')).toBeInTheDocument(); // mean_psi
    expect(screen.getByText(/Mean Ψ \(half-bits\)/i)).toBeInTheDocument();
    expect(screen.getByText('0.81')).toBeInTheDocument(); // mean_entropy_seq1
    expect(screen.getByText('0.76')).toBeInTheDocument(); // mean_entropy_seq2
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

  it('switches to the Ψ Correction tab', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /Ψ Correction/i }));

    expect(screen.getByText(/Ψ Relative-Entropy Correction/i)).toBeInTheDocument();
    expect(screen.getByText('Most Influential Columns')).toBeInTheDocument();
  });

  it('switches to the Complexity & Gaps tab', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /complexity & gaps/i }));

    expect(screen.getByText(/Local Sequence Complexity/i)).toBeInTheDocument();
    expect(screen.getByText(/Entropy-Adaptive Gap-Open Penalty/i)).toBeInTheDocument();
  });

  it('switches to the References tab', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /^references$/i }));

    expect(screen.getByText('Algorithm Reference')).toBeInTheDocument();
    expect(screen.getByText('Public Database Links')).toBeInTheDocument();
    expect(screen.getByText('UniProt')).toBeInTheDocument();
  });

  it('calls downloadJSON with the lare-nw filename when the export button is clicked', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    fireEvent.click(screen.getByRole('button', { name: /download json/i }));

    expect(api.downloadJSON).toHaveBeenCalledTimes(1);
    expect(api.downloadJSON).toHaveBeenCalledWith(
      RESULTS_FIXTURE[0],
      'lare-nw-alignment',
    );
  });

  it('renders alignment visualization with category-based residue classes', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    // Switch to alignment tab
    fireEvent.click(screen.getByRole('button', { name: /pairwise alignment/i }));

    // Identical positions (pos 1 & 2) map to .res-match
    const matchSpans = document.querySelectorAll('.res-match');
    expect(matchSpans.length).toBeGreaterThan(0);

    // 'similar' positions map to .res-conservative
    const similarSpans = document.querySelectorAll('.res-conservative');
    expect(similarSpans.length).toBeGreaterThan(0);

    // 'gap' position maps to .res-gap
    const gapSpans = document.querySelectorAll('.res-gap');
    expect(gapSpans.length).toBeGreaterThan(0);

    // 'mismatch' positions map to .res-mismatch
    const mismatchSpans = document.querySelectorAll('.res-mismatch');
    expect(mismatchSpans.length).toBeGreaterThan(0);
  });

  it('renders performance and parameter information in overview', () => {
    render(<AlignmentResults results={RESULTS_FIXTURE} />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText(/0.023s/)).toBeInTheDocument();
    expect(screen.getByText(/1.2 MB/)).toBeInTheDocument();
    expect(screen.getByText('Parameters Used')).toBeInTheDocument();

    // New LARE-NW param tags are rendered from params_used.
    expect(screen.getByText('alpha=20')).toBeInTheDocument();
    expect(screen.getByText('gamma=0.5')).toBeInTheDocument();
    expect(screen.getByText('g_base=-10')).toBeInTheDocument();
    expect(screen.getByText('g_ext=-1')).toBeInTheDocument();
    expect(screen.getByText('bandwidth=5')).toBeInTheDocument();
  });
});
