import type { FormInput, PaymentLink } from './types';
import { getStatus } from './status';
import { normalizePhone, parseAmountToPaise, validateForm } from './validation';

export const PAYMENT_LINKS_STORAGE_KEY = 'payment-links-manager:v1';

export interface PaymentLinkService {
  list(): PaymentLink[]; // newest first
  create(input: FormInput): PaymentLink;
  recordPayment(id: string, amount: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeStoredLink(value: unknown): PaymentLink | null {
  if (!isRecord(value)) return null;
  const { id, amountPaise, description, email, phone, expiresAt, createdAt } = value;
  if (
    typeof id !== 'string' ||
    !isSafeInteger(amountPaise) ||
    amountPaise <= 0 ||
    typeof description !== 'string' ||
    !isFiniteNumber(createdAt) ||
    (email !== undefined && typeof email !== 'string') ||
    (phone !== undefined && typeof phone !== 'string') ||
    (expiresAt !== undefined && !isFiniteNumber(expiresAt))
  ) {
    return null;
  }

  const amount = amountPaise;
  const amountPaidPaise = isSafeInteger(value.amountPaidPaise)
    ? value.amountPaidPaise
    : typeof value.paid === 'boolean'
      ? value.paid
        ? amount
        : 0
      : null;
  if (amountPaidPaise === null || amountPaidPaise < 0 || amountPaidPaise > amount) return null;

  const allowPartialPayments = value.allowPartialPayments === true;
  const minimumFirstPaymentPaise = isSafeInteger(value.minimumFirstPaymentPaise)
    ? value.minimumFirstPaymentPaise
    : null;
  if (
    allowPartialPayments &&
    (minimumFirstPaymentPaise === null ||
      minimumFirstPaymentPaise <= 0 ||
      minimumFirstPaymentPaise > amount)
  ) {
    return null;
  }

  return {
    id,
    amountPaise: amount,
    description,
    ...(email !== undefined ? { email } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    allowPartialPayments,
    ...(allowPartialPayments && minimumFirstPaymentPaise !== null ? { minimumFirstPaymentPaise } : {}),
    amountPaidPaise,
    createdAt,
  };
}

function loadLinks(storage: Storage): PaymentLink[] {
  const saved = storage.getItem(PAYMENT_LINKS_STORAGE_KEY);
  if (saved === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    return [];
  }

  const isLegacyArray = Array.isArray(parsed);
  const envelope = isRecord(parsed) ? parsed : null;
  const envelopeLinks = envelope?.links;
  const records: unknown[] | null = Array.isArray(parsed)
    ? parsed
    : Array.isArray(envelopeLinks) &&
        envelope &&
        (envelope.version === 1 || envelope.version === 0 || envelope.version === undefined)
      ? envelopeLinks
      : null;
  if (records === null) return [];

  const links = records.map(normalizeStoredLink);
  if (!links.every((link): link is PaymentLink => link !== null)) return [];

  const normalized = links;
  const needsMigration =
    isLegacyArray ||
    envelope?.version !== 1 ||
    records.some(
      (record) =>
        isRecord(record) &&
        ('paid' in record ||
          !('amountPaidPaise' in record) ||
          !('allowPartialPayments' in record)),
    );
  if (needsMigration) saveLinks(storage, normalized);
  return normalized;
}

function saveLinks(storage: Storage, links: PaymentLink[]) {
  storage.setItem(PAYMENT_LINKS_STORAGE_KEY, JSON.stringify({ version: 1, links }));
}

/** Persistent local store. Swap this for an API client without changing the UI. */
export function createPaymentLinkService(storage: Storage = window.localStorage): PaymentLinkService {
  let links = loadLinks(storage);
  let counter = 0;

  return {
    list: () => [...links].sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id)),
    create(input) {
      if (Object.keys(validateForm(input)).length > 0) throw new Error('Invalid payment link data.');
      const email = input.email.trim();
      const phone = normalizePhone(input.phone);
      const amountPaise = parseAmountToPaise(input.amount)!;
      const minimumFirstPaymentPaise = input.allowPartialPayments
        ? parseAmountToPaise(input.minimumFirstPayment)!
        : undefined;
      const link: PaymentLink = {
        id: `pl_${Date.now()}_${counter++}`,
        amountPaise,
        description: input.description.trim(),
        email: email || undefined,
        phone: phone || undefined,
        expiresAt: input.expiry ? new Date(input.expiry).getTime() : undefined,
        allowPartialPayments: input.allowPartialPayments,
        ...(minimumFirstPaymentPaise !== undefined ? { minimumFirstPaymentPaise } : {}),
        amountPaidPaise: 0,
        createdAt: Date.now(),
      };
      const next = [link, ...links];
      saveLinks(storage, next);
      links = next;
      return link;
    },
    recordPayment(id, rawAmount) {
      const link = links.find((item) => item.id === id);
      if (!link) throw new Error('Payment link not found.');
      if (getStatus(link) === 'Paid') throw new Error('This payment link is already paid.');
      if (getStatus(link) === 'Expired') throw new Error('Expired payment links cannot accept payments.');

      const amount = parseAmountToPaise(rawAmount);
      if (amount === null || amount <= 0) {
        throw new Error('Enter a payment greater than 0 with at most 2 decimals.');
      }

      const due = link.amountPaise - link.amountPaidPaise;
      if (amount > due) throw new Error('Payment cannot exceed the amount due.');
      if (!link.allowPartialPayments && amount !== due) {
        throw new Error('This link requires payment of the full amount due.');
      }
      if (
        link.allowPartialPayments &&
        link.amountPaidPaise === 0 &&
        amount < (link.minimumFirstPaymentPaise ?? 0)
      ) {
        throw new Error('Payment must meet the minimum first payment.');
      }

      const next = links.map((item) =>
        item.id === id ? { ...item, amountPaidPaise: item.amountPaidPaise + amount } : item,
      );
      saveLinks(storage, next);
      links = next;
    },
  };
}
