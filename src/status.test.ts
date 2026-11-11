import { describe, expect, it } from 'vitest';
import { filterLinks, getStatus } from './status';
import type { PaymentLink } from './types';

const NOW = 1_000_000;
const make = (o: Partial<PaymentLink>): PaymentLink => ({
  id: 'x', amountPaise: 100, description: 'd', email: 'a@b.co', paid: false, createdAt: 0, ...o,
});

describe('getStatus', () => {
  it('is Active with no expiry or a future expiry', () => {
    expect(getStatus(make({}), NOW)).toBe('Active');
    expect(getStatus(make({ expiresAt: NOW + 1 }), NOW)).toBe('Active');
  });
  it('is Expired once expiry has passed', () => {
    expect(getStatus(make({ expiresAt: NOW - 1 }), NOW)).toBe('Expired');
  });
  it('Paid takes precedence over Expired', () => {
    expect(getStatus(make({ paid: true, expiresAt: NOW - 1 }), NOW)).toBe('Paid');
  });
});

describe('filterLinks', () => {
  const links = [
    make({ id: 'a' }),
    make({ id: 'p', paid: true }),
    make({ id: 'e', expiresAt: NOW - 5 }),
  ];
  it('returns everything for All', () => expect(filterLinks(links, 'All', NOW)).toHaveLength(3));
  it.each([['Active', 'a'], ['Paid', 'p'], ['Expired', 'e']] as const)('filters %s', (f, id) => {
    expect(filterLinks(links, f, NOW).map((l) => l.id)).toEqual([id]);
  });
});
