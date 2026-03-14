import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Suppress the expected console.error output from ErrorBoundary and React
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

// ---------------------------------------------------------------------------
// Helper: a component that throws on demand
// ---------------------------------------------------------------------------
function Bomb({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Boom!');
  }
  return <p>Child content</p>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows error UI when a child throws during render', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong displaying results')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred while rendering this section.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('resets error state and re-renders children when "Try Again" is clicked', () => {
    // We render Bomb with a prop that we can toggle via a wrapper.
    function Wrapper() {
      const [bad, setBad] = React.useState(true);
      return (
        <>
          <button onClick={() => setBad(false)}>Fix</button>
          <ErrorBoundary>
            <Bomb shouldThrow={bad} />
          </ErrorBoundary>
        </>
      );
    }

    render(<Wrapper />);

    // Initially the boundary catches the error
    expect(screen.getByText('Something went wrong displaying results')).toBeInTheDocument();

    // "Fix" the child so it no longer throws
    fireEvent.click(screen.getByText('Fix'));

    // Click "Try Again" to reset the error boundary
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // The child should now render normally
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
