import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the default workspace dashboard shell', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
    expect(screen.getByText('WorkSpace')).toBeInTheDocument();
    expect(screen.getAllByText('Product Launch Q2').length).toBeGreaterThan(0);
  });
});
