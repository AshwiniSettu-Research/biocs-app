import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 20px',
      minHeight: '50vh',
      background: '#e8e8e8',
    }}>
      <h1 style={{ fontSize: '64px', color: '#333', margin: '0 0 8px' }}>404</h1>
      <h2 style={{ fontSize: '20px', color: '#555', margin: '0 0 16px', fontWeight: 500 }}>
        Page Not Found
      </h2>
      <p style={{ fontSize: '14px', color: '#777', marginBottom: '24px' }}>
        The page you are looking for does not exist or is under development.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '10px 28px',
          background: 'linear-gradient(135deg, #00695c, #00838f)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
