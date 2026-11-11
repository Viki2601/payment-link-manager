import { useState, type FormEvent } from 'react';
import type { PaymentLink, StatusFilter } from '../types';
import { getStatus } from '../status';
import { formatDateTime, formatINR } from '../format';

export const FILTERS: StatusFilter[] = ['All', 'Active', 'Partially paid', 'Paid', 'Expired'];

interface Props {
  links: PaymentLink[]; // already filtered
  totalCount: number;
  filter: StatusFilter;
  now: number;
  onFilterChange: (f: StatusFilter) => void;
  onRecordPayment: (id: string, amount: string) => string | undefined;
}

export function PaymentLinkList({
  links,
  totalCount,
  filter,
  now,
  onFilterChange,
  onRecordPayment,
}: Props) {
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const submitPayment = (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const error = onRecordPayment(id, paymentAmounts[id] ?? '');
    setPaymentErrors((previous) => ({ ...previous, [id]: error ?? '' }));
    if (!error) setPaymentAmounts((previous) => ({ ...previous, [id]: '' }));
  };

  return (
    <section aria-labelledby="list-title" className="card">
      <h2 id="list-title">Payment links</h2>

      <div role="group" aria-label="Filter by status" className="filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={f === filter ? 'chip active' : 'chip'}
            aria-pressed={f === filter}
            onClick={() => onFilterChange(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {links.length === 0 ? (
        <p className="empty" role="status">
          {totalCount === 0
            ? 'No payment links yet. Create your first one above.'
            : `No ${filter.toLowerCase()} links match this filter.`}
        </p>
      ) : (
        <ul className="links" aria-label="Payment links">
          {links.map((link) => {
            const status = getStatus(link, now);
            const due = link.amountPaise - link.amountPaidPaise;
            const errorId = `payment-error-${link.id}`;
            const error = paymentErrors[link.id];
            return (
              <li key={link.id} className="link-row" data-testid="link-row">
                <div className="link-main">
                  <strong className="amount">{formatINR(link.amountPaise)}</strong>
                  <span className={`badge ${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
                </div>
                <p className="desc">{link.description}</p>
                <p className="meta">
                  {link.email ?? link.phone}
                  {' · Created '}
                  {formatDateTime(link.createdAt)}
                  {link.expiresAt !== undefined && <> · Expires {formatDateTime(link.expiresAt)}</>}
                </p>
                <p className="payment-summary">
                  Paid {formatINR(link.amountPaidPaise)} · Due {formatINR(due)}
                </p>
                {(status === 'Active' || status === 'Partially paid') && (
                  <form className="payment-form" noValidate onSubmit={(event) => submitPayment(event, link.id)}>
                    <label htmlFor={`payment-amount-${link.id}`}>Payment amount (₹)</label>
                    <input
                      id={`payment-amount-${link.id}`}
                      inputMode="decimal"
                      autoComplete="off"
                      required
                      value={paymentAmounts[link.id] ?? ''}
                      onChange={(event) =>
                        setPaymentAmounts((previous) => ({ ...previous, [link.id]: event.target.value }))
                      }
                      aria-required="true"
                      aria-invalid={!!error}
                      aria-describedby={error ? errorId : undefined}
                    />
                    {error && (
                      <p id={errorId} className="field-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="secondary"
                      aria-label={`Record payment: ${link.description}`}
                    >
                      Record payment
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
