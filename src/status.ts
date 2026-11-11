import type { PaymentLink, Status, StatusFilter } from './types';

/** Paid takes precedence over Expired, which takes precedence over Partially paid and Active. */
export function getStatus(link: PaymentLink, now: number = Date.now()): Status {
  if (link.amountPaidPaise >= link.amountPaise) return 'Paid';
  if (link.expiresAt !== undefined && link.expiresAt <= now) return 'Expired';
  if (link.amountPaidPaise > 0) return 'Partially paid';
  return 'Active';
}

export function filterLinks(links: PaymentLink[], filter: StatusFilter, now: number = Date.now()) {
  return filter === 'All' ? links : links.filter((l) => getStatus(l, now) === filter);
}
