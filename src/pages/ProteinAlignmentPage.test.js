import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProteinAlignmentPage from './ProteinAlignmentPage';

// ---------------------------------------------------------------------------
// Mock CSS imports that Jest cannot parse
// ---------------------------------------------------------------------------
jest.mock('./ProteinAlignmentPage.css', () => {});
jest.mock('../components/alignment/AlignmentResults.css', () => {});

// ---------------------------------------------------------------------------
// Mock AlignmentResults to keep tests focused on the page logic
// ---------------------------------------------------------------------------
jest.mock('../components/alignment/AlignmentResults', () => {
  return function MockAlignmentResults({ results }) {
    return (
      <div data-testid="alignment-results">
        <span>Score: {results[0]?.score}</span>
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
const ALIGNMENT_API_RESPONSE = {
  results: [
    {
      score: 112.5,
      identity: 42.0,
      alignment_length: 52,
      matches: 22,
      mismatches: 28,
      gaps: 2,
      gap_opens: 1,
      aligned_seq1: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH',
      aligned_seq2: 'MVHLTPEEKSAVTALWGKV--NVDEVGGEALGRLLVVYPWTQRFFESFGDL',
      position_scores: [],
      scoring_breakdown: {},
    },
  ],
};

const UNIPROT_API_RESPONSE = {
  entry_name: 'HBA_HUMAN',
  protein_name: 'Hemoglobin subunit alpha',
  sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Helper to fill both sequence textareas with minimal valid input.
 */
function fillSequences() {
  const textareas = screen.getAllByRole('textbox');
  // The first two textbox-role elements are the sequence textareas
  const seqTextareas = textareas.filter(
    (el) => el.tagName === 'TEXTAREA',
  );
  fireEvent.change(seqTextareas[0], { target: { value: 'MVLSPADKTNVKAAWGKVGA' } });
  fireEvent.change(seqTextareas[1], { target: { value: 'MVHLTPEEKSAVTALWGKVNV' } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ProteinAlignmentPage', () => {
  it('renders page with all key elements', () => {
    render(<ProteinAlignmentPage />);

    // Header
    expect(screen.getByText(/CM-BLOSUM-NW Protein Sequence Alignment/i)).toBeInTheDocument();

    // Step headers
    expect(screen.getByText(/STEP 1/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 2/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 3/)).toBeInTheDocument();

    // Two sequence textareas
    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
    expect(textareas.length).toBe(2);

    // Parameter inputs (alpha, beta, gap_open, gap_extend, bandwidth)
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(5);

    // Submit button
    expect(screen.getByRole('button', { name: /submit alignment/i })).toBeInTheDocument();
  });

  it('shows the submit button as disabled and with "Aligning..." text while loading', async () => {
    // fetch that never resolves to keep loading state
    global.fetch.mockReturnValue(new Promise(() => {}));

    render(<ProteinAlignmentPage />);
    fillSequences();

    fireEvent.click(screen.getByRole('button', { name: /submit alignment/i }));

    const btn = await screen.findByRole('button', { name: /aligning/i });
    expect(btn).toBeDisabled();
  });

  it('shows an error when submitting with empty sequences', async () => {
    render(<ProteinAlignmentPage />);

    fireEvent.click(screen.getByRole('button', { name: /submit alignment/i }));

    expect(
      await screen.findByText(/please enter both sequences before submitting/i),
    ).toBeInTheDocument();
  });

  it('performs a successful alignment submission and renders results', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ALIGNMENT_API_RESPONSE),
    });

    render(<ProteinAlignmentPage />);
    fillSequences();

    fireEvent.click(screen.getByRole('button', { name: /submit alignment/i }));

    // Wait for results to appear
    expect(await screen.findByTestId('alignment-results')).toBeInTheDocument();
    expect(screen.getByText('Score: 112.5')).toBeInTheDocument();
  });

  it('fetches a UniProt sequence and fills the textarea', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(UNIPROT_API_RESPONSE),
    });

    render(<ProteinAlignmentPage />);

    // Find the first UniProt input field and type an ID
    const uniprotInputs = screen.getAllByPlaceholderText(/uniprot id/i);
    fireEvent.change(uniprotInputs[0], { target: { value: 'P69905' } });

    // Click the first "Fetch" button
    const fetchButtons = screen.getAllByRole('button', { name: /^fetch$/i });
    fireEvent.click(fetchButtons[0]);

    // Wait for the textarea to be filled with the fetched sequence
    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
      expect(textareas[0].value).toContain('HBA_HUMAN');
      expect(textareas[0].value).toContain('MVLSPADKTNVKAAWGKVGA');
    });
  });

  it('reads file content on file upload', async () => {
    render(<ProteinAlignmentPage />);

    const fileContent = '>test_protein\nMVLSPADKTNVKAAWGKVGA';
    const file = new File([fileContent], 'test.fasta', { type: 'text/plain' });

    // Find the first file input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThanOrEqual(1);

    // Simulate file selection
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    // Wait for FileReader to complete (it fires asynchronously)
    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
      expect(textareas[0].value).toContain('MVLSPADKTNVKAAWGKVGA');
    });
  });

  it('fills both textareas when "Load Example" is clicked', () => {
    render(<ProteinAlignmentPage />);

    fireEvent.click(screen.getByRole('button', { name: /load example/i }));

    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
    expect(textareas[0].value).toContain('HBA_HUMAN');
    expect(textareas[0].value).toContain('MVLSPADKTNVKAAWGKVGA');
    expect(textareas[1].value).toContain('HBB_HUMAN');
    expect(textareas[1].value).toContain('MVHLTPEEKSAVTALWGKVNV');
  });

  it('shows server error message on failed alignment submission', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal alignment failure' }),
    });

    render(<ProteinAlignmentPage />);
    fillSequences();

    fireEvent.click(screen.getByRole('button', { name: /submit alignment/i }));

    expect(await screen.findByText('Internal alignment failure')).toBeInTheDocument();
  });
});
