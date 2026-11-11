import type { FormInput, PaymentLink } from './types';
import { normalizePhone, parseAmountToPaise, validateForm } from './validation';

export interface PaymentLinkService {
  list(): PaymentLink[]; // newest first
  create(input: FormInput): PaymentLink;
  markPaid(id: string): void;
}

/** In-memory store. Swap this for an API client later without touching the UI. */
export function createPaymentLinkService(): PaymentLinkService {
  let links: PaymentLink[] = [];
  let counter = 0;

  return {
    list: () => [...links].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id)),
    create(input) {
      if (Object.keys(validateForm(input)).length > 0) throw new Error('Invalid payment link data.');
      const email = input.email.trim();
      const phone = normalizePhone(input.phone);
      const link: PaymentLink = {
        id: `pl_${Date.now()}_${counter++}`,
        amountPaise: parseAmountToPaise(input.amount)!,
        description: input.description.trim(),
        email: email || undefined,
        phone: phone || undefined,
        expiresAt: input.expiry ? new Date(input.expiry).getTime() : undefined,
        paid: false,
        createdAt: Date.now(),
      };
      links = [link, ...links];
      return link;
    },
    markPaid(id) {
      if (!links.some((l) => l.id === id)) throw new Error('Payment link not found.');
      links = links.map((l) => (l.id === id ? { ...l, paid: true } : l));
    },
  };
}
