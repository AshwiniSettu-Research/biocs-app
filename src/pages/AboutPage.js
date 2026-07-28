import React from 'react';
import ResearchTeam from '../components/ResearchTeam';
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
              <h3>LARE-NW Protein Sequence Alignment</h3>
              <p>
                A pairwise protein sequence alignment tool built on the Needleman-Wunsch global alignment algorithm,
                enhanced with Locally Adaptive Relative-Entropy (LARE) scoring. Rather than using a fixed
                substitution matrix, LARE-NW corrects each BLOSUM62 score position-by-position with a relative-entropy
                term Ψ derived from a Dirichlet-multinomial posterior estimate of the local amino-acid composition,
                using the BLOSUM62-implicit background frequencies (Yu &amp; Altschul, 2005). Gap-opening penalties are
                modulated by local sequence entropy, so gaps are cheaper in low-complexity regions and costlier in
                structured ones. The algorithm uses a banded three-matrix Gotoh dynamic program with corrected
                initialization (Flouri et al., 2015) for efficiency on long sequences. Users can tune the posterior
                concentration (alpha), window half-width (w), and entropy sensitivity (gamma).
              </p>
            </div>
            <div className="about-tool-block about-tool-purple">
              <h3>MLPT-LARE Antigenic Peptide Predictor</h3>
              <p>
                A deep-learning model that predicts whether a peptide is a cancer T-cell antigenic epitope
                (binary: Antigenic / Non-antigenic). The Multi-Level Pooling Transformer (MLPT-LARE, 199,225
                parameters) runs an Adaptive Deep Multi-branch Attention Module (ADMAM) and 1-D Swin
                Transformer blocks with masked pooling over a per-residue feature stream: the 20-dimensional
                LARE-NW Bayesian posterior (from the alignment tool's Objective 1 model) plus the
                Kolaskar &amp; Tongaonkar antigenicity propensity, fused with physicochemical descriptors.
                LARE-NW's posterior hyperparameters were tuned with an SA-BWK metaheuristic. Because the model
                is trained for ranking, it reports a probability plus a class at a tunable decision threshold
                (default 0.455, the F1-optimal operating point) rather than a naive 0.5 cutoff.
              </p>
            </div>
            <div className="about-tool-block about-tool-indigo">
              <h3>Multi-Epitope Vaccine Designer</h3>
              <p>
                A design tool that assembles a K-peptide vaccine construct from a pool of candidate
                epitopes. Each candidate is scored on three objectives — predicted antigenicity from
                MLPT-LARE (Tool&nbsp;2), cross-variant conservation from LARE-NW (Tool&nbsp;1, when reference
                variant sequences are provided), and HLA class-I population coverage (IEDB Hardy-Weinberg
                model over Allele Frequency Net Database frequencies for Caucasoid, East-Asian,
                Indian-subcontinent, or global populations). A composite fitness
                (0.5·mean antigenicity + 0.3·min conservation + 0.2·joint coverage − 0.15·redundancy)
                is maximised over subsets by a discrete Self-improved Black-Winged Kite (SA-BWK)
                metaheuristic — greedy warm-started and benchmarked live against greedy and random
                selection. The result is a construct with a per-peptide breakdown, multi-population
                coverage, and the optimiser's convergence trajectory.
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
          <ResearchTeam showHeader={false} />
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
