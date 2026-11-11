import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows validation errors and the empty state, then creates and filters links', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/no payment links yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /create link/i }));
    expect(screen.getByText('Amount is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (₹)')).toHaveAttribute('aria-describedby', 'amount-error');

    await user.type(screen.getByLabelText('Amount (₹)'), '2500');
    await user.type(screen.getByLabelText('Description'), 'Order 1');
    await user.type(screen.getByLabelText('Email'), 'c@x.com');
    await user.click(screen.getByRole('button', { name: /create link/i }));

    const rows = screen.getAllByTestId('link-row');
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText('₹2,500.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark as paid/i }));
    await user.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.getByText(/no active links match/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Paid' }));
    expect(screen.getAllByTestId('link-row')).toHaveLength(1);
  });
});
