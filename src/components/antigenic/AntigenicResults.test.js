import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AntigenicResults from './AntigenicResults';
import * as api from '../../utils/api';

jest.mock('./AntigenicResults.css', () => {});
jest.mock('../../utils/api', () => ({
  downloadJSON: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Binary MLPT-LARE fixtures
// ---------------------------------------------------------------------------
const antigenicPred = (over = {}) => ({
  sequence: 'SLLMWITQC',
  sequence_length: 9,
  antigenic: true,
  predicted_class: 'Antigenic',
  antigenic_probability: 0.7364,
  confidence: 0.7364,
  decision_threshold: 0.455,
  probabilities: { Antigenic: 0.7364, 'Non-antigenic': 0.2636 },
  kt_scores: [0.84, 1.24, 1.24, 0.74, 1.06, 1.0, 0.76, 0.85, 0.68],
  antigenicity_score: 0.9344,
  antigenic_regions: [[0, 2]],
  mean_posterior_entropy: 0.9626,
  warning: null,
  ...over,
});

const MODEL_INFO = {
  model: 'MLPT-LARE',
  task: 'binary',
  params: 199225,
  auc_roc: 0.697,
  f1: 0.591,
  mcc: 0.297,
  decision_threshold: 0.455,
};

const SINGLE_PREDICTION_FIXTURE = {
  predictions: [antigenicPred()],
  model_info: MODEL_INFO,
};

const BATCH_PREDICTION_FIXTURE = {
  predictions: [
    antigenicPred(),
    antigenicPred({
      sequence: 'AAAAAAAAAA',
      sequence_length: 10,
      antigenic: false,
      predicted_class: 'Non-antigenic',
      antigenic_probability: 0.42,
      confidence: 0.58,
      probabilities: { Antigenic: 0.42, 'Non-antigenic': 0.58 },
      kt_scores: [1.044, 1.044, 1.044, 1.044, 1.044, 1.044, 1.044, 1.044, 1.044, 1.044],
      antigenicity_score: 1.044,
      antigenic_regions: [[0, 9]],
      mean_posterior_entropy: 0.81,
    }),
    antigenicPred({ sequence: 'EVDPIGHLY', antigenic_probability: 0.751 }),
  ],
  model_info: MODEL_INFO,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AntigenicResults (binary MLPT-LARE)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when results is null', () => {
    const { container } = render(<AntigenicResults results={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders null when predictions array is empty', () => {
    const { container } = render(
      <AntigenicResults results={{ predictions: [], model_info: {} }} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders overview with the binary prediction summary', () => {
    render(<AntigenicResults results={SINGLE_PREDICTION_FIXTURE} />);

    expect(screen.getByText('Prediction Results')).toBeInTheDocument();

    // Binary class badge + probability (P(antigenic) and confidence both 73.6%)
    expect(screen.getByText('Antigenic')).toBeInTheDocument();
    expect(screen.getAllByText('73.6%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('P(antigenic)')).toBeInTheDocument();
    expect(screen.getByText(/threshold 45.5%/)).toBeInTheDocument();

    // Sequence details
    expect(screen.getByText('SLLMWITQC')).toBeInTheDocument();
    expect(screen.getByText('9 residues')).toBeInTheDocument();
    expect(screen.getByText('0.9344')).toBeInTheDocument(); // mean K-T
    expect(screen.getByText('0.9626')).toBeInTheDocument(); // mean posterior entropy

    // Model info
    expect(screen.getByText('MLPT-LARE (binary)')).toBeInTheDocument();
    expect(screen.getByText('199,225')).toBeInTheDocument();
    expect(screen.getByText('0.697')).toBeInTheDocument();

    expect(screen.queryByText(/Batch Results/)).not.toBeInTheDocument();
  });

  it('renders a warning when present', () => {
    const withWarning = {
      predictions: [antigenicPred({ warning: 'Truncated to first 25 residues.' })],
      model_info: MODEL_INFO,
    };
    render(<AntigenicResults results={withWarning} />);
    expect(screen.getByText(/Truncated to first 25 residues/)).toBeInTheDocument();
  });

  it('renders the batch table for multiple predictions', () => {
    render(<AntigenicResults results={BATCH_PREDICTION_FIXTURE} />);
    expect(screen.getByText(/Batch Results \(3 sequences\)/)).toBeInTheDocument();
    expect(screen.getAllByText('SLLMWITQC').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('AAAAAAAAAA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EVDPIGHLY').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the two-class probability distribution', () => {
    render(<AntigenicResults results={SINGLE_PREDICTION_FIXTURE} />);
    fireEvent.click(screen.getByRole('button', { name: /probabilities/i }));
    expect(screen.getByText('Class Probability Distribution')).toBeInTheDocument();
    // Both classes appear as probability labels (badge also renders "Antigenic").
    expect(screen.getAllByText('Antigenic').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Non-antigenic')).toBeInTheDocument();
  });

  it('switches to the Antigenicity Profile tab', () => {
    render(<AntigenicResults results={SINGLE_PREDICTION_FIXTURE} />);
    fireEvent.click(screen.getByRole('button', { name: /antigenicity profile/i }));
    expect(screen.getByText(/Per-Residue Antigenicity/)).toBeInTheDocument();
    const legendItems = document.querySelectorAll('.kt-legend-item');
    expect(legendItems.length).toBe(3);
  });

  it('switches to the References tab with MLPT-LARE reference', () => {
    render(<AntigenicResults results={SINGLE_PREDICTION_FIXTURE} />);
    fireEvent.click(screen.getByRole('button', { name: /references/i }));
    expect(screen.getByText(/References & Methods/)).toBeInTheDocument();
    expect(screen.getByText(/MLPT-LARE:/)).toBeInTheDocument();
  });

  it('calls downloadJSON when the export button is clicked', () => {
    render(<AntigenicResults results={SINGLE_PREDICTION_FIXTURE} />);
    fireEvent.click(screen.getByRole('button', { name: /download json/i }));
    expect(api.downloadJSON).toHaveBeenCalledTimes(1);
    expect(api.downloadJSON).toHaveBeenCalledWith(
      SINGLE_PREDICTION_FIXTURE,
      'mlpt-lare-predictions',
    );
  });

  it('selects a different prediction in batch mode via row click', () => {
    render(<AntigenicResults results={BATCH_PREDICTION_FIXTURE} />);
    expect(document.querySelector('.pred-class-badge').textContent).toBe('Antigenic');

    const rows = document.querySelectorAll('.batch-row');
    expect(rows.length).toBe(3);
    fireEvent.click(rows[1]);

    expect(document.querySelector('.pred-class-badge').textContent).toBe('Non-antigenic');
  });
});
