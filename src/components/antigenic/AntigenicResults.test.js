import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AntigenicResults from './AntigenicResults';
import * as api from '../../utils/api';

// ---------------------------------------------------------------------------
// Mock CSS import
// ---------------------------------------------------------------------------
jest.mock('./AntigenicResults.css', () => {});

// ---------------------------------------------------------------------------
// Mock downloadJSON
// ---------------------------------------------------------------------------
jest.mock('../../utils/api', () => ({
  downloadJSON: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Fixture: single prediction
// ---------------------------------------------------------------------------
const SINGLE_PREDICTION_FIXTURE = {
  predictions: [
    {
      sequence: 'FIASNGVKLV',
      sequence_length: 10,
      predicted_class: 'Natural Peptide',
      confidence: 0.92,
      antigenicity_score: 1.05,
      probabilities: {
        'Cancer Antigenic Peptides': 0.02,
        'Inactive Peptides-Lung Breast': 0.01,
        'Moderately Active-Lung Breast': 0.03,
        'Natural Peptide': 0.92,
        'Non-Natural Peptide': 0.01,
        'Very Active-Lung Breast': 0.01,
      },
      kt_scores: [1.1, 0.9, 1.2, 1.0, 0.8, 1.3, 1.1, 0.7, 1.0, 1.2],
      antigenic_regions: [[2, 5]],
    },
  ],
  model_info: {
    num_classes: 6,
    accuracy: 0.94,
    macro_f1: 0.91,
  },
};

// ---------------------------------------------------------------------------
// Fixture: batch predictions (multiple)
// ---------------------------------------------------------------------------
const BATCH_PREDICTION_FIXTURE = {
  predictions: [
    {
      sequence: 'FIASNGVKLV',
      sequence_length: 10,
      predicted_class: 'Natural Peptide',
      confidence: 0.92,
      antigenicity_score: 1.05,
      probabilities: {
        'Cancer Antigenic Peptides': 0.02,
        'Inactive Peptides-Lung Breast': 0.01,
        'Moderately Active-Lung Breast': 0.03,
        'Natural Peptide': 0.92,
        'Non-Natural Peptide': 0.01,
        'Very Active-Lung Breast': 0.01,
      },
      kt_scores: [1.1, 0.9, 1.2, 1.0, 0.8, 1.3, 1.1, 0.7, 1.0, 1.2],
      antigenic_regions: [[2, 5]],
    },
    {
      sequence: 'GILGFVFTL',
      sequence_length: 9,
      predicted_class: 'Very Active-Lung Breast',
      confidence: 0.78,
      antigenicity_score: 1.21,
      probabilities: {
        'Cancer Antigenic Peptides': 0.05,
        'Inactive Peptides-Lung Breast': 0.02,
        'Moderately Active-Lung Breast': 0.1,
        'Natural Peptide': 0.03,
        'Non-Natural Peptide': 0.02,
        'Very Active-Lung Breast': 0.78,
      },
      kt_scores: [1.3, 0.8, 1.0, 1.4, 1.2, 1.1, 1.0, 0.9, 1.3],
      antigenic_regions: [[0, 3], [6, 8]],
    },
    {
      sequence: 'NLVPMVATV',
      sequence_length: 9,
      predicted_class: 'Cancer Antigenic Peptides',
      confidence: 0.65,
      antigenicity_score: 0.98,
      probabilities: {
        'Cancer Antigenic Peptides': 0.65,
        'Inactive Peptides-Lung Breast': 0.05,
        'Moderately Active-Lung Breast': 0.1,
        'Natural Peptide': 0.08,
        'Non-Natural Peptide': 0.07,
        'Very Active-Lung Breast': 0.05,
      },
      kt_scores: [0.9, 1.1, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0],
      antigenic_regions: [],
    },
  ],
  model_info: {
    num_classes: 6,
    accuracy: 0.94,
    macro_f1: 0.91,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AntigenicResults', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when results is null', () => {
    const { container } = render(
      <AntigenicResults results={null} confidenceThreshold={0.5} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders null when predictions array is empty', () => {
    const { container } = render(
      <AntigenicResults
        results={{ predictions: [], model_info: {} }}
        confidenceThreshold={0.5}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders overview tab with prediction summary for a single prediction', () => {
    render(
      <AntigenicResults
        results={SINGLE_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    // Header
    expect(screen.getByText('Prediction Results')).toBeInTheDocument();

    // Predicted class badge
    expect(screen.getByText('Natural Peptide')).toBeInTheDocument();

    // Confidence
    expect(screen.getByText('92.0%')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();

    // Sequence details
    expect(screen.getByText('FIASNGVKLV')).toBeInTheDocument();
    expect(screen.getByText('10 residues')).toBeInTheDocument();
    expect(screen.getByText('1.05')).toBeInTheDocument(); // antigenicity score

    // Model info
    expect(screen.getByText(/MLPT \(6-class\)/)).toBeInTheDocument();
    expect(screen.getByText('94.0%')).toBeInTheDocument(); // accuracy
    expect(screen.getByText('91.0%')).toBeInTheDocument(); // macro f1

    // No batch table for single prediction
    expect(screen.queryByText(/Batch Results/)).not.toBeInTheDocument();
  });

  it('renders batch table for multiple predictions', () => {
    render(
      <AntigenicResults
        results={BATCH_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    // Batch summary heading
    expect(screen.getByText(/Batch Results \(3 sequences\)/)).toBeInTheDocument();

    // Table headers - use getAllByText since "Sequence" appears multiple times
    const sequenceElements = screen.getAllByText('Sequence');
    expect(sequenceElements.length).toBeGreaterThanOrEqual(1);

    // All three sequences should appear (some may appear in both detail and table)
    expect(screen.getAllByText('FIASNGVKLV').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GILGFVFTL').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('NLVPMVATV').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to the Probabilities tab and shows probability distribution', () => {
    render(
      <AntigenicResults
        results={SINGLE_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /probabilities/i }));

    expect(screen.getByText('Class Probability Distribution')).toBeInTheDocument();

    // All class names should be displayed as probability labels
    expect(screen.getByText('Cancer Antigenic Peptides')).toBeInTheDocument();
    expect(screen.getByText('Inactive Peptides-Lung Breast')).toBeInTheDocument();
    expect(screen.getByText('Very Active-Lung Breast')).toBeInTheDocument();
  });

  it('switches to the Antigenicity Profile tab', () => {
    render(
      <AntigenicResults
        results={SINGLE_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /antigenicity profile/i }));

    expect(screen.getByText(/Per-Residue Antigenicity/)).toBeInTheDocument();
    // Legend items - use exact text to avoid ambiguity
    expect(screen.getByText('Below threshold', { exact: false })).toBeInTheDocument();
    // Check for the legend color element that indicates antigenic
    const legendItems = document.querySelectorAll('.kt-legend-item');
    expect(legendItems.length).toBe(3); // Below threshold, Antigenic, Avg Score
  });

  it('switches to the References tab', () => {
    render(
      <AntigenicResults
        results={SINGLE_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /references/i }));

    expect(screen.getByText(/References & Methods/)).toBeInTheDocument();
    expect(screen.getByText(/MLPT Model:/)).toBeInTheDocument();
  });

  it('calls downloadJSON when the export button is clicked', () => {
    render(
      <AntigenicResults
        results={SINGLE_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /download json/i }));

    expect(api.downloadJSON).toHaveBeenCalledTimes(1);
    expect(api.downloadJSON).toHaveBeenCalledWith(
      SINGLE_PREDICTION_FIXTURE,
      'mlpt-predictions',
    );
  });

  it('shows "Below threshold" when confidence is below the threshold', () => {
    const lowConfResult = {
      ...SINGLE_PREDICTION_FIXTURE,
      predictions: [
        { ...SINGLE_PREDICTION_FIXTURE.predictions[0], confidence: 0.3 },
      ],
    };

    render(
      <AntigenicResults results={lowConfResult} confidenceThreshold={0.5} />,
    );

    expect(screen.getByText('Below threshold')).toBeInTheDocument();
  });

  it('does not show "Below threshold" when confidence meets the threshold', () => {
    render(
      <AntigenicResults
        results={SINGLE_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    // Confidence is 0.92, well above 0.5 threshold
    expect(screen.queryByText('Below threshold')).not.toBeInTheDocument();
  });

  it('allows selecting a different prediction in batch mode via row click', () => {
    render(
      <AntigenicResults
        results={BATCH_PREDICTION_FIXTURE}
        confidenceThreshold={0.5}
      />,
    );

    // Initially the first prediction's details are shown
    const initialBadge = document.querySelector('.pred-class-badge');
    expect(initialBadge.textContent).toBe('Natural Peptide');

    // Click the second row in the batch table (GILGFVFTL)
    const rows = document.querySelectorAll('.batch-row');
    expect(rows.length).toBe(3);
    fireEvent.click(rows[1]);

    // Now the detail section should show the second prediction's class
    const updatedBadge = document.querySelector('.pred-class-badge');
    expect(updatedBadge.textContent).toBe('Very Active-Lung Breast');
  });
});
