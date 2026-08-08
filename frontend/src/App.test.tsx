import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Secure Vault heading', () => {
  render(<App />);
  const heading = screen.getByText(/secure vault/i);
  expect(heading).toBeInTheDocument();
});
