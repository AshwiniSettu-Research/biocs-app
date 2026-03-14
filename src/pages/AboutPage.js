import React from 'react';
import './AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About BIOCS</h1>
      </div>

      <div className="about-content">
        {/* Overview */}
        <section className="about-section">
          <h2 className="about-section-title">Overview</h2>
          <p className="about-text">
            BIOCS (Biosequence Analyser) is a computational biology platform developed at the School of Computing,
            SRM Institute of Science and Technology, Chennai. The platform provides researchers and students with
            access to specialized bioinformatics tools for protein sequence analysis and antigenic peptide prediction.
            BIOCS integrates novel algorithmic approaches with modern deep learning architectures to deliver
            accurate and interpretable results for molecular biology research.
          </p>
        </section>

        {/* Tools */}
        <section className="about-section">
          <h2 className="about-section-title">Platform Tools</h2>
          <div className="about-tools">
            <div className="about-tool-block about-tool-teal">
              <h3>CM-BLOSUM-NW Protein Sequence Alignment</h3>
              <p>
                A pairwise protein sequence alignment tool built on the Needleman-Wunsch global alignment algorithm,
                enhanced with a Composite Matrix (CM) scoring system. The CM integrates three scoring components:
                the standard BLOSUM62 substitution matrix, residue-level information content derived from
                position-specific frequency analysis, and dipeptide log-odds scores capturing contextual
                amino acid pairing preferences. The algorithm employs affine gap penalties with separate
                gap-open and gap-extend costs, and uses banded dynamic programming to improve computational
                efficiency on long sequences. Users can modulate the contribution of information content
                (alpha) and dipeptide composition (beta) to fine-tune alignment sensitivity.
              </p>
            </div>
            <div className="about-tool-block about-tool-purple">
              <h3>MLPT Antigenic Peptide Predictor</h3>
              <p>
                A deep learning-based T-cell epitope prediction system powered by the Multi-Level Pooling-based
                Transformer (MLPT) architecture. The model uses a Swin Transformer backbone with an Adaptive
                Dual-stream Multi-scale Attention Module (ADMAM) for feature extraction, combined with a
                K-T Algorithm for sequence encoding and SA-BWK (Simulated Annealing with Bayesian-Weighted Kernels)
                optimization for training stability. The classifier performs six-class categorization of peptide
                sequences, identifying viral antigenic peptides, bacterial antigenic peptides, tumor antigenic
                peptides (cancer-associated), allergen-associated peptides, autoimmune-associated peptides, and
                non-antigenic peptides. A configurable confidence threshold allows users to control prediction
                stringency.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="about-section">
          <h2 className="about-section-title">Mission</h2>
          <p className="about-text">
            BIOCS aims to bridge the gap between advanced computational methods and practical bioinformatics
            research by providing accessible, web-based tools that implement novel algorithms developed through
            original research. The platform is designed for researchers, graduate students, and bioinformatics
            practitioners who require reliable sequence analysis without the overhead of local software
            installation and configuration.
          </p>
        </section>

        {/* Research Group */}
        <section className="about-section">
          <h2 className="about-section-title">Research Group</h2>
          <div className="about-researcher">
            <p><strong>Principal Researcher:</strong> Ashwini Settu</p>
            <p><strong>Department:</strong> School of Computing</p>
            <p><strong>Institution:</strong> SRM Institute of Science and Technology, Chennai, Tamil Nadu, India</p>
            <p><strong>Contact:</strong> ashwinisettu.as@gmail.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
