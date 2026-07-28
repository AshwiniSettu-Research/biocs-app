import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VaccineDesignerPage from './VaccineDesignerPage';

jest.mock('./VaccineDesignerPage.css', () => {});
jest.mock('../components/vaccine/VaccineResults.css', () => {});
jest.mock('../components/vaccine/VaccineResults', () => () => (
  <div data-testid="vaccine-results">results</div>
));

beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => jest.restoreAllMocks());

const getTextarea = () => document.querySelector('.vaccine-textarea');

const okResponse = (body) => ({ ok: true, json: () => Promise.resolve(body) });

describe('VaccineDesignerPage', () => {
  it('renders the key page elements', () => {
    render(<VaccineDesignerPage />);
    expect(screen.getByText(/Multi-Epitope Vaccine Designer/i)).toBeInTheDocument();
    expect(screen.getByText(/STEP 1/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 2/)).toBeInTheDocument();
    expect(screen.getByText(/STEP 3/)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // population select
    expect(screen.getByRole('button', { name: /design vaccine construct/i })).toBeInTheDocument();
  });

  it('loads the example pool and counts candidates', () => {
    render(<VaccineDesignerPage />);
    fireEvent.click(screen.getByRole('button', { name: /load example pool/i }));
    expect(screen.getByText(/15 candidates detected/i)).toBeInTheDocument();
  });

  it('blocks submission when the pool is too small for K', async () => {
    render(<VaccineDesignerPage />);
    fireEvent.change(getTextarea(), { target: { value: 'SLLMWITQC\nEVDPIGHLY' } });
    fireEvent.click(screen.getByRole('button', { name: /design vaccine construct/i }));
    expect(await screen.findByText(/needs more than/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('posts the design request with the expected payload', async () => {
    global.fetch.mockResolvedValueOnce(okResponse({ construct: [{ peptide: 'X' }] }));
    render(<VaccineDesignerPage />);
    fireEvent.click(screen.getByRole('button', { name: /load example pool/i }));
    fireEvent.click(screen.getByRole('button', { name: /design vaccine construct/i }));

    expect(await screen.findByTestId('vaccine-results')).toBeInTheDocument();
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/vaxdesign/design');
    const body = JSON.parse(opts.body);
    expect(body.peptides.length).toBe(15);
    expect(body.population).toBe('caucasoid');
    expect(body.k).toBe(10);
    expect(body.weights).toEqual({ antigenicity: 0.5, conservation: 0.3, coverage: 0.2 });
    expect(body.apply_filters).toBe(true);
  });
});
