import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the default workspace dashboard shell', () => {
    render(<App />);
    expect(screen.getByText('WorkSpace')).toBeInTheDocument();
    expect(screen.getAllByText('Product Launch Q2').length).toBeGreaterThan(0);
  });
});
