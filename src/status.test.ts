import { describe, expect, it } from 'vitest';
import { filterLinks, getStatus } from './status';
import type { PaymentLink } from './types';

const NOW = 1_000_000;
const make = (o: Partial<PaymentLink>): PaymentLink => ({
  id: 'x',
  amountPaise: 100,
  description: 'd',
  email: 'a@b.co',
  allowPartialPayments: false,
  amountPaidPaise: 0,
  createdAt: 0,
  ...o,
});

describe('getStatus', () => {
  it('is Active with no expiry or a future expiry and no payments', () => {
    expect(getStatus(make({}), NOW)).toBe('Active');
    expect(getStatus(make({ expiresAt: NOW + 1 }), NOW)).toBe('Active');
  });
  it('is Expired once expiry has passed', () => {
    expect(getStatus(make({ expiresAt: NOW - 1 }), NOW)).toBe('Expired');
    expect(getStatus(make({ expiresAt: NOW }), NOW)).toBe('Expired');
  });
  it('is Partially paid when a non-expired link has a positive balance paid', () => {
    expect(getStatus(make({ amountPaidPaise: 1 }), NOW)).toBe('Partially paid');
  });
  it('Expired takes precedence over Partially paid', () => {
    expect(getStatus(make({ amountPaidPaise: 1, expiresAt: NOW - 1 }), NOW)).toBe('Expired');
  });
  it('Paid takes precedence over Expired when fully paid', () => {
    expect(getStatus(make({ amountPaidPaise: 100, expiresAt: NOW - 1 }), NOW)).toBe('Paid');
  });
});

describe('filterLinks', () => {
  const links = [
    make({ id: 'a' }),
    make({ id: 'p', amountPaidPaise: 100 }),
    make({ id: 'pp', amountPaidPaise: 10 }),
    make({ id: 'e', expiresAt: NOW - 5 }),
  ];
  it('returns everything for All', () => expect(filterLinks(links, 'All', NOW)).toHaveLength(4));
  it.each([
    ['Active', 'a'],
    ['Paid', 'p'],
    ['Partially paid', 'pp'],
    ['Expired', 'e'],
  ] as const)('filters %s', (f, id) => {
    expect(filterLinks(links, f, NOW).map((l) => l.id)).toEqual([id]);
  });
});
