import type { FormErrors, FormInput } from './types';

export const MAX_AMOUNT = 500000;
export const MAX_DESCRIPTION = 100;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+91)?[6-9]\d{9}$/; // 10-digit Indian mobile, optional +91

export const normalizePhone = (v: string) => v.replace(/[\s-]/g, '');

/** Parses "1234.50" into integer paise, or null if not a valid amount string. */
export function parseAmountToPaise(raw: string): number | null {
  const v = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const [whole, frac = ''] = v.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

export function validateForm(input: FormInput, now: number = Date.now()): FormErrors {
  const errors: FormErrors = {};

  const amount = input.amount.trim();
  const amountPaise = parseAmountToPaise(amount);
  if (!amount) {
    errors.amount = 'Amount is required.';
  } else {
    if (amountPaise === null) errors.amount = 'Enter a valid amount with at most 2 decimals.';
    else if (amountPaise <= 0) errors.amount = 'Amount must be greater than 0.';
    else if (amountPaise > MAX_AMOUNT * 100) errors.amount = 'Amount cannot exceed ₹5,00,000.';
  }

  const description = input.description.trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length > MAX_DESCRIPTION)
    errors.description = `Description must be ${MAX_DESCRIPTION} characters or fewer.`;

  const email = input.email.trim();
  const phone = normalizePhone(input.phone);
  if (!email && !phone) {
    errors.contact = 'Provide a customer email or phone number.';
  } else if (email && !EMAIL_RE.test(email)) {
    errors.contact = 'Enter a valid email address.';
  } else if (phone && !PHONE_RE.test(phone)) {
    errors.contact = 'Enter a valid 10-digit mobile number (optional +91).';
  }

  if (input.expiry) {
    const t = new Date(input.expiry).getTime();
    if (Number.isNaN(t)) errors.expiry = 'Enter a valid expiry date.';
    else if (t <= now) errors.expiry = 'Expiry must be in the future.';
  }

  if (input.allowPartialPayments) {
    const minimum = parseAmountToPaise(input.minimumFirstPayment);
    if (!input.minimumFirstPayment.trim()) {
      errors.minimumFirstPayment = 'Minimum first payment is required.';
    } else if (minimum === null) {
      errors.minimumFirstPayment = 'Enter a valid amount with at most 2 decimals.';
    } else if (minimum <= 0) {
      errors.minimumFirstPayment = 'Minimum first payment must be greater than 0.';
    } else if (amountPaise !== null && minimum > amountPaise) {
      errors.minimumFirstPayment = 'Minimum first payment cannot exceed the link amount.';
    }
  }

  return errors;
}
