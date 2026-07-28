import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VaccineResults from './VaccineResults';
import * as api from '../../utils/api';

jest.mock('./VaccineResults.css', () => {});
jest.mock('../../utils/api', () => ({ downloadJSON: jest.fn() }));

const RESULT = {
  construct: [
    { peptide: 'EVDPIGHLY', length: 9, antigenicity: 0.751, conservation: 1.0,
      coverage: 0.591, binders: ['HLA-A*01:01', 'HLA-B*44:02'], n_binders: 2, druggable: true },
    { peptide: 'ELAGIGILTV', length: 10, antigenicity: 0.753, conservation: 1.0,
      coverage: 0.519, binders: ['HLA-A*02:01'], n_binders: 1, druggable: true },
  ],
  selected_by: 'SA-BWK',
  fitness: { fitness: 0.8583, mean_antigenicity: 0.75, min_conservation: 1.0,
    mean_conservation: 1.0, joint_coverage: 0.917, redundancy: 0.0,
    unique_alleles: 15, n_peptides: 2 },
  methods: { sabwk: 0.8583, greedy: 0.8583, random_best: 0.8583, random_mean: 0.8416 },
  trajectory: [{ iter: -1, best: 0.80, mean: 0.77 }, { iter: 0, best: 0.85, mean: 0.80 },
    { iter: 1, best: 0.858, mean: 0.82 }],
  population_coverage: { caucasoid: 0.917, asian: 0.899, indian_subcontinent: 0.878, global: 0.825 },
  pool: { submitted: 15, valid: 15, filtered_out: 5, filter_fell_back: false, pool_size: 10, k: 2 },
  conservation_active: false,
  weights: { antigenicity: 0.5, conservation: 0.3, coverage: 0.2 },
  population: 'caucasoid',
  model_info: { model: 'MLPT-LARE' },
};

describe('VaccineResults', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders null when no construct', () => {
    const { container } = render(<VaccineResults results={{ construct: [] }} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows fitness, selected-by, and the construct peptides', () => {
    render(<VaccineResults results={RESULT} />);
    expect(screen.getByText('0.8583')).toBeInTheDocument();
    expect(screen.getByText(/selected by SA-BWK/)).toBeInTheDocument();
    expect(screen.getByText('EVDPIGHLY')).toBeInTheDocument();
    expect(screen.getByText('ELAGIGILTV')).toBeInTheDocument();
    expect(screen.getByText(/15 submitted → 15 valid/)).toBeInTheDocument();
  });

  it('shows population coverage on the coverage tab', () => {
    render(<VaccineResults results={RESULT} />);
    fireEvent.click(screen.getByRole('button', { name: /population coverage/i }));
    expect(screen.getByText(/Caucasoid \(target\)/)).toBeInTheDocument();
    expect(screen.getByText('91.7%')).toBeInTheDocument();
    expect(screen.getByText(/HLA-A\*01:01/)).toBeInTheDocument();
  });

  it('shows optimizer comparison and trajectory', () => {
    render(<VaccineResults results={RESULT} />);
    fireEvent.click(screen.getByRole('button', { name: /optimizer/i }));
    expect(screen.getAllByText('SA-BWK').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Greedy')).toBeInTheDocument();
    expect(screen.getByText('Random (best)')).toBeInTheDocument();
    expect(document.querySelector('.traj-svg')).toBeInTheDocument();
  });

  it('renders references tab', () => {
    render(<VaccineResults results={RESULT} />);
    fireEvent.click(screen.getByRole('button', { name: /references/i }));
    expect(screen.getByText(/SA-BWK optimiser:/)).toBeInTheDocument();
  });

  it('exports JSON', () => {
    render(<VaccineResults results={RESULT} />);
    fireEvent.click(screen.getByRole('button', { name: /download json/i }));
    expect(api.downloadJSON).toHaveBeenCalledWith(RESULT, 'vaccine-construct');
  });
});
