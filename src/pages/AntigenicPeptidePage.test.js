import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AntigenicPeptidePage from './AntigenicPeptidePage';

// ---------------------------------------------------------------------------
// Mock CSS imports
// ---------------------------------------------------------------------------
jest.mock('./AntigenicPeptidePage.css', () => {});
jest.mock('../components/antigenic/AntigenicResults.css', () => {});

// ---------------------------------------------------------------------------
// Mock AntigenicResults to keep tests focused on the page logic
// ---------------------------------------------------------------------------
jest.mock('../components/antigenic/AntigenicResults', () => {
  return function MockAntigenicResults({ results }) {
    return (
      <div data-testid="antigenic-results">
        <span>Predictions: {results.predictions.length}</span>
      </div>
    );
  };
});

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const PREDICTION_API_RESPONSE = {
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
// Helpers
// ---------------------------------------------------------------------------
function getMainTextarea() {
  return screen.getAllByRole('textbox').find((el) => el.tagName === 'TEXTAREA');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AntigenicPeptidePage', () => {
  it('renders page with all key elements', () => {
    render(<AntigenicPeptidePage />);

    // Header
    expect(screen.getByText(/MLPT Antigenic Peptide Predictor/i)).toBeInTheDocument();

    // Step headers
    expect(screen.getByText(/STEP 1/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 2/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 3/)).toBeInTheDocument();

    // Textarea
    expect(getMainTextarea()).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole('button', { name: /submit prediction/i })).toBeInTheDocument();

    // Confidence slider
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // parseSequences — we test it indirectly via the sequence count display
  // -----------------------------------------------------------------------
  it('parses plain text input (one sequence per line) and updates count', () => {
    render(<AntigenicPeptidePage />);
    const textarea = getMainTextarea();

    fireEvent.change(textarea, {
      target: { value: 'FIASNGVKLV\nGILGFVFTL\nNLVPMVATV' },
    });

    expect(screen.getByText(/3 sequences detected/i)).toBeInTheDocument();
  });

  it('parses FASTA format input and updates count', () => {
    render(<AntigenicPeptidePage />);
    const textarea = getMainTextarea();

    const fasta = '>peptide_1\nFIASNGVKLV\n>peptide_2\nGILGFVFTL';
    fireEvent.change(textarea, { target: { value: fasta } });

    expect(screen.getByText(/2 sequences detected/i)).toBeInTheDocument();
  });

  it('shows an error when submitting with empty input', async () => {
    render(<AntigenicPeptidePage />);

    fireEvent.click(screen.getByRole('button', { name: /submit prediction/i }));

    expect(
      await screen.findByText(/please enter at least one peptide sequence/i),
    ).toBeInTheDocument();
  });

  it('performs a successful prediction submission and renders results', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(PREDICTION_API_RESPONSE),
    });

    render(<AntigenicPeptidePage />);
    const textarea = getMainTextarea();
    fireEvent.change(textarea, { target: { value: 'FIASNGVKLV' } });

    fireEvent.click(screen.getByRole('button', { name: /submit prediction/i }));

    expect(await screen.findByTestId('antigenic-results')).toBeInTheDocument();
    expect(screen.getByText('Predictions: 1')).toBeInTheDocument();
  });

  it('fills textarea when "Load Example Sequences" is clicked', () => {
    render(<AntigenicPeptidePage />);

    fireEvent.click(screen.getByRole('button', { name: /load example/i }));

    const textarea = getMainTextarea();
    expect(textarea.value).toContain('FIASNGVKLV');
    expect(textarea.value).toContain('GILGFVFTL');
    expect(textarea.value).toContain('NLVPMVATV');

    // 4 example sequences
    expect(screen.getByText(/4 sequences detected/i)).toBeInTheDocument();
  });

  it('updates sequence count as user types', () => {
    render(<AntigenicPeptidePage />);
    const textarea = getMainTextarea();

    // Initially 0 sequences
    expect(screen.getByText(/0 sequences detected/i)).toBeInTheDocument();

    // Type one sequence
    fireEvent.change(textarea, { target: { value: 'FIASNGVKLV' } });
    expect(screen.getByText(/1 sequence detected/i)).toBeInTheDocument();

    // Add a second
    fireEvent.change(textarea, { target: { value: 'FIASNGVKLV\nGILGFVFTL' } });
    expect(screen.getByText(/2 sequences detected/i)).toBeInTheDocument();
  });

  it('shows an error when more than 100 sequences are submitted', async () => {
    render(<AntigenicPeptidePage />);
    const textarea = getMainTextarea();

    // Build 101 sequences using FASTA headers so parseSequences treats them individually
    const lines = Array.from({ length: 101 }, (_, i) => `>seq_${i}\nACDEFGHIKLMNPQRSTVWY`).join('\n');
    fireEvent.change(textarea, { target: { value: lines } });

    fireEvent.click(screen.getByRole('button', { name: /submit prediction/i }));

    expect(
      await screen.findByText(/maximum 100 sequences per request/i),
    ).toBeInTheDocument();
  });

  it('shows server error message on failed prediction submission', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Model failed to load' }),
    });

    render(<AntigenicPeptidePage />);
    const textarea = getMainTextarea();
    fireEvent.change(textarea, { target: { value: 'FIASNGVKLV' } });

    fireEvent.click(screen.getByRole('button', { name: /submit prediction/i }));

    expect(await screen.findByText('Model failed to load')).toBeInTheDocument();
  });
});
