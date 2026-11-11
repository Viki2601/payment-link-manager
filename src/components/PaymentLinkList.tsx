import type { PaymentLink, StatusFilter } from '../types';
import { getStatus } from '../status';
import { formatDateTime, formatINR } from '../format';

export const FILTERS: StatusFilter[] = ['All', 'Active', 'Paid', 'Expired'];

interface Props {
  links: PaymentLink[]; // already filtered
  totalCount: number;
  filter: StatusFilter;
  now: number;
  onFilterChange: (f: StatusFilter) => void;
  onMarkPaid: (id: string) => void;
}

export function PaymentLinkList({ links, totalCount, filter, now, onFilterChange, onMarkPaid }: Props) {
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
          {links.map((l) => {
            const status = getStatus(l, now);
            return (
              <li key={l.id} className="link-row" data-testid="link-row">
                <div className="link-main">
                  <strong className="amount">{formatINR(l.amountPaise)}</strong>
                  <span className={`badge ${status.toLowerCase()}`}>{status}</span>
                </div>
                <p className="desc">{l.description}</p>
                <p className="meta">
                  {l.email ?? l.phone}
                  {' · Created '}
                  {formatDateTime(l.createdAt)}
                  {l.expiresAt !== undefined && <> · Expires {formatDateTime(l.expiresAt)}</>}
                </p>
                {status !== 'Paid' && (
                  <button type="button" className="secondary" onClick={() => onMarkPaid(l.id)}>
                    Mark as paid<span className="sr-only">: {l.description}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
