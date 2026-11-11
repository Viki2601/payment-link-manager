import { beforeEach, describe, expect, it } from 'vitest';
import { PAYMENT_LINKS_STORAGE_KEY, createPaymentLinkService } from './service';
import type { FormInput } from './types';

const validInput: FormInput = {
  amount: '100',
  description: 'Invoice',
  email: 'customer@example.com',
  phone: '',
  expiry: '',
  allowPartialPayments: false,
  minimumFirstPayment: '',
};

describe('payment link service', () => {
  beforeEach(() => localStorage.clear());

  it('enforces payment amounts and partial-payment rules', () => {
    const service = createPaymentLinkService();
    const fullLink = service.create(validInput);
    expect(() => service.recordPayment(fullLink.id, '50')).toThrow(/full amount due/);
    expect(() => service.recordPayment(fullLink.id, '100.01')).toThrow(/exceed/);
    expect(() => service.recordPayment(fullLink.id, '0')).toThrow(/greater than 0/);

    const partialLink = service.create({
      ...validInput,
      allowPartialPayments: true,
      minimumFirstPayment: '20',
    });
    expect(() => service.recordPayment(partialLink.id, '19.99')).toThrow(/minimum first payment/);
    service.recordPayment(partialLink.id, '20');
    expect(service.list().find((link) => link.id === partialLink.id)?.amountPaidPaise).toBe(2000);
    service.recordPayment(partialLink.id, '80');
    expect(service.list().find((link) => link.id === partialLink.id)?.amountPaidPaise).toBe(10_000);
    expect(() => service.recordPayment(partialLink.id, '1')).toThrow(/already paid/);
  });

  it('persists new links and payments across service instances', () => {
    const first = createPaymentLinkService();
    const link = first.create({
      ...validInput,
      allowPartialPayments: true,
      minimumFirstPayment: '10',
    });
    first.recordPayment(link.id, '25.50');

    const second = createPaymentLinkService();
    expect(second.list()).toEqual([{ ...link, amountPaidPaise: 2550 }]);
  });

  it('migrates legacy paid booleans to paise totals', () => {
    localStorage.setItem(
      PAYMENT_LINKS_STORAGE_KEY,
      JSON.stringify([
        { id: 'legacy-paid', amountPaise: 1000, description: 'Paid', paid: true, createdAt: 1 },
        { id: 'legacy-unpaid', amountPaise: 2000, description: 'Unpaid', paid: false, createdAt: 2 },
      ]),
    );

    const service = createPaymentLinkService();
    expect(service.list().map((link) => link.amountPaidPaise)).toEqual([0, 1000]);
    const saved = JSON.parse(localStorage.getItem(PAYMENT_LINKS_STORAGE_KEY) ?? 'null');
    expect(saved.version).toBe(1);
    expect(saved.links.every((link: { paid?: boolean }) => !('paid' in link))).toBe(true);
  });

  it('starts empty when saved JSON is corrupt', () => {
    localStorage.setItem(PAYMENT_LINKS_STORAGE_KEY, '{bad json');
    expect(createPaymentLinkService().list()).toEqual([]);
  });
});
