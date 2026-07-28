import React from 'react';
import './ResearchTeam.css';

// Ordered: Researcher → Guide → Co-guide.
const TEAM = [
  {
    role: 'Researcher',
    name: 'Ashwini Settu',
    title: 'PhD Candidate · Data Science & Bioinformatics',
    org: 'SRM Institute of Science and Technology',
    location: 'Chennai, Tamil Nadu, India',
    profile: 'https://www.linkedin.com/in/ashwinisettu/',
    profileLabel: 'LinkedIn Profile',
    initials: 'AS',
    accent: 'researcher',
    featured: true,
  },
  {
    role: 'Guide',
    name: 'Prof. Dr. R. I. Minu',
    title: 'Professor · Doctoral Supervisor',
    org: 'SRM Institute of Science and Technology',
    location: 'Chennai, Tamil Nadu, India',
    profile: 'https://www.srmist.edu.in/faculty/dr-r-i-minu/',
    profileLabel: 'Faculty Profile',
    initials: 'RM',
    accent: 'guide',
  },
  {
    role: 'Co-Guide',
    name: 'Dr. M. Jeevan Kumar',
    title: 'Co-Supervisor',
    org: 'The Apollo University',
    location: 'Chittoor, Andhra Pradesh, India',
    profile: 'https://apollouniversity.edu.in/faculty/dr-m-jeevan-kumar/',
    profileLabel: 'Faculty Profile',
    initials: 'JK',
    accent: 'coguide',
  },
];

const IconBuilding = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11" />
    <path d="M8 7h2M8 11h2M8 15h2" />
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);

function TeamCard({ member }) {
  return (
    <a
      className={`rt-card rt-${member.accent} ${member.featured ? 'rt-featured' : ''}`}
      href={member.profile}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="rt-accent-bar" aria-hidden="true" />
      <span className="rt-role-badge">{member.role}</span>
      <div className="rt-card-body">
        <div className="rt-avatar" aria-hidden="true">
          <span>{member.initials}</span>
        </div>
        <div className="rt-info">
          <h4 className="rt-name">{member.name}</h4>
          <p className="rt-title">{member.title}</p>
          <div className="rt-meta"><IconBuilding /><span>{member.org}</span></div>
          <div className="rt-meta"><IconPin /><span>{member.location}</span></div>
        </div>
      </div>
      <span className="rt-profile-link">
        {member.profileLabel}
        <IconArrow />
      </span>
    </a>
  );
}

function ResearchTeam({ heading = 'Research Team', subtitle, showHeader = true }) {
  const featured = TEAM.filter((m) => m.featured);
  const supervisors = TEAM.filter((m) => !m.featured);

  return (
    <div className="research-team">
      {showHeader && (
        <div className="rt-header">
          <h3 className="rt-heading">{heading}</h3>
          <p className="rt-subtitle">
            {subtitle || 'The people behind BIOCS and the underlying PhD research.'}
          </p>
        </div>
      )}

      <div className="rt-featured-row">
        {featured.map((m) => <TeamCard key={m.name} member={m} />)}
      </div>

      <div className="rt-supervisors-label">
        <span>Under the guidance of</span>
      </div>

      <div className="rt-grid">
        {supervisors.map((m) => <TeamCard key={m.name} member={m} />)}
      </div>
    </div>
  );
}

export default ResearchTeam;
