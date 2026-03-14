import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom since Jest has trouble resolving it
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element || null,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: '/' }),
}), { virtual: true });

// Mock CSS imports
jest.mock('./App.css', () => {});

// Import App after mocks are set up
const App = require('./App').default;

test('renders BIOCS app without crashing', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/BIOCS/i);
  expect(titleElements.length).toBeGreaterThanOrEqual(1);
});
