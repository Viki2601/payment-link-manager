import { describe, expect, it } from 'vitest';
import { parseAmountToPaise, validateForm } from './validation';
import type { FormInput } from './types';

const NOW = new Date('2026-11-11T10:00:00').getTime();
const valid: FormInput = { amount: '1500.50', description: 'Invoice 42', email: 'a@b.co', phone: '', expiry: '' };

describe('validateForm', () => {
  it('accepts a valid input with email only', () => {
    expect(validateForm(valid, NOW)).toEqual({});
  });

  it.each([
    ['', 'required'],
    ['0', 'greater than 0'],
    ['-5', 'valid amount'],
    ['10.999', 'valid amount'],
    ['abc', 'valid amount'],
    ['500000.01', 'exceed'],
  ])('rejects amount %j', (amount, msg) => {
    expect(validateForm({ ...valid, amount }, NOW).amount).toContain(msg);
  });

  it('accepts the max amount boundary of 500000', () => {
    expect(validateForm({ ...valid, amount: '500000' }, NOW).amount).toBeUndefined();
  });

  it('enforces description required and max 100 chars', () => {
    expect(validateForm({ ...valid, description: '  ' }, NOW).description).toBeDefined();
    expect(validateForm({ ...valid, description: 'x'.repeat(100) }, NOW).description).toBeUndefined();
    expect(validateForm({ ...valid, description: 'x'.repeat(101) }, NOW).description).toBeDefined();
  });

  it('requires at least one of email or phone, and validates whichever is given', () => {
    expect(validateForm({ ...valid, email: '' }, NOW).contact).toMatch(/email or phone/);
    expect(validateForm({ ...valid, email: 'nope' }, NOW).contact).toMatch(/email/);
    expect(validateForm({ ...valid, email: '', phone: '12345' }, NOW).contact).toMatch(/mobile/);
    expect(validateForm({ ...valid, email: '', phone: '+91 98765-43210' }, NOW).contact).toBeUndefined();
  });

  it('requires expiry, when provided, to be in the future', () => {
    expect(validateForm({ ...valid, expiry: '2026-11-11T09:00' }, NOW).expiry).toMatch(/future/);
    expect(validateForm({ ...valid, expiry: '2026-11-12T09:00' }, NOW).expiry).toBeUndefined();
  });
});

describe('parseAmountToPaise', () => {
  it('converts without floating point error', () => {
    expect(parseAmountToPaise('0.1')).toBe(10);
    expect(parseAmountToPaise('19.99')).toBe(1999);
    expect(parseAmountToPaise('500000')).toBe(50_000_000);
  });
});
