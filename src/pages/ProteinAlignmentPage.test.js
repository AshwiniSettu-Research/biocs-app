import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
// Fixtures (LARE-NW /api/align response shape)
// ---------------------------------------------------------------------------
const ALIGNMENT_API_RESPONSE = {
  results: [
    {
      algorithm: 'LARE-NW',
      aligned_seq1: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH',
      aligned_seq2: 'MVHLTPEEKSAVTALWGKV--NVDEVGGEALGRLLVVYPWTQRFFESFGDL',
      score: 112.5,
      alignment_length: 52,
      identity: 30.0,
      matches: 18,
      mismatches: 32,
      similarity: 50.0,
      similarity_count: 26,
      gaps: 2,
      gap_pct: 3.8,
      mean_psi: 1.42,
      mean_entropy_seq1: 0.81,
      mean_entropy_seq2: 0.76,
      bandwidth_used: 7,
      runtime_seconds: 0.031,
      memory_peak_mb: 1.4,
      seq1_length: 50,
      seq2_length: 50,
      params_used: { alpha: 20, w: 15, gamma: 0.5, g_base: -10.0, g_ext: -1.0, bandwidth: 7 },
      position_scores: [],
      position_scores_truncated: false,
      entropy_seq1: [],
      entropy_seq2: [],
      entropy_truncated: false,
      gap_penalty_seq1: [],
      gap_penalty_seq2: [],
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
    expect(screen.getByText(/LARE-NW Protein Sequence Alignment/i)).toBeInTheDocument();

    // Step headers
    expect(screen.getByText(/STEP 1/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 2/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 3/)).toBeInTheDocument();

    // Two sequence textareas
    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
    expect(textareas.length).toBe(2);

    // Parameter inputs: alpha, w, gamma, g_base, g_ext are number inputs (spinbuttons).
    // bandwidth defaults to '' which keeps it a spinbutton too.
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(6);

    // Submit button
    expect(screen.getByRole('button', { name: /submit alignment/i })).toBeInTheDocument();
  });

  it('renders the LARE-NW parameter controls with their default values', () => {
    render(<ProteinAlignmentPage />);

    // Default param values: alpha=20, w=15, gamma=0.5, g_base=-10, g_ext=-1, bandwidth=''
    const spinbuttons = screen.getAllByRole('spinbutton');
    const values = spinbuttons.map((el) => el.value);

    expect(values).toContain('20'); // alpha
    expect(values).toContain('15'); // w
    expect(values).toContain('0.5'); // gamma
    expect(values).toContain('-10'); // g_base
    expect(values).toContain('-1'); // g_ext

    // bandwidth defaults to blank (auto) and shows the "auto" placeholder
    expect(screen.getByPlaceholderText('auto')).toBeInTheDocument();
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

  it('posts to /api/align with the LARE-NW params payload', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ALIGNMENT_API_RESPONSE),
    });

    render(<ProteinAlignmentPage />);
    fillSequences();

    fireEvent.click(screen.getByRole('button', { name: /submit alignment/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/align');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.algorithm).toBe('lare_nw');
    expect(body.params).toEqual({
      alpha: 20,
      w: 15,
      gamma: 0.5,
      g_base: -10.0,
      g_ext: -1.0,
      bandwidth: 'auto', // blank bandwidth becomes 'auto'
    });
    // Old CM-BLOSUM-NW params must be gone.
    expect(body.params).not.toHaveProperty('beta');
    expect(body.params).not.toHaveProperty('gap_open');
    expect(body.params).not.toHaveProperty('gap_extend');
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
