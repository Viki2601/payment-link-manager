import { useState, type FormEvent } from 'react';
import type { FormErrors, FormInput } from '../types';
import { validateForm, MAX_DESCRIPTION } from '../validation';

const EMPTY: FormInput = { amount: '', description: '', email: '', phone: '', expiry: '' };

interface Props {
  onCreate: (input: FormInput) => void;
  submitError?: string | null;
}

export function PaymentLinkForm({ onCreate, submitError }: Props) {
  const [values, setValues] = useState<FormInput>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const set = (field: keyof FormInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (touched.size > 0) setErrors(validateForm(next)); // live re-validate once the user has interacted
  };

  const blur = (group: string) => () => {
    setTouched((t) => new Set(t).add(group));
    setErrors(validateForm(values));
  };

  // Only show an error once its field group has been touched or a submit was attempted.
  const show = (key: keyof FormErrors) => (touched.has(key) || touched.has('submit') ? errors[key] : undefined);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateForm(values);
    setErrors(errs);
    setTouched(new Set(['submit']));
    if (Object.keys(errs).length > 0) return;
    onCreate(values);
    setValues(EMPTY);
    setErrors({});
    setTouched(new Set());
  };

  const err = (id: string, msg?: string) =>
    msg ? (
      <p id={id} className="field-error" role="alert">
        {msg}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby="form-title" className="card">
      <h2 id="form-title">Create payment link</h2>

      <div className="field">
        <label htmlFor="amount">Amount (₹)</label>
        <input
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          value={values.amount}
          onChange={set('amount')}
          onBlur={blur('amount')}
          aria-required="true"
          aria-invalid={!!show('amount')}
          aria-describedby={show('amount') ? 'amount-error' : undefined}
        />
        {err('amount-error', show('amount'))}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          value={values.description}
          onChange={set('description')}
          onBlur={blur('description')}
          maxLength={MAX_DESCRIPTION + 20 /* allow typing past the limit so the error is visible */}
          aria-required="true"
          aria-invalid={!!show('description')}
          aria-describedby={show('description') ? 'description-error' : undefined}
        />
        {err('description-error', show('description'))}
      </div>

      <fieldset className="field" aria-describedby={show('contact') ? 'contact-error' : 'contact-hint'}>
        <legend>Customer contact</legend>
        <p id="contact-hint" className="hint">
          Provide an email or a phone number (at least one).
        </p>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="off"
          value={values.email}
          onChange={set('email')}
          onBlur={blur('contact')}
          aria-invalid={!!show('contact')}
        />
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          autoComplete="off"
          value={values.phone}
          onChange={set('phone')}
          onBlur={blur('contact')}
          aria-invalid={!!show('contact')}
        />
        {err('contact-error', show('contact'))}
      </fieldset>

      <div className="field">
        <label htmlFor="expiry">Expiry (optional)</label>
        <input
          id="expiry"
          type="datetime-local"
          value={values.expiry}
          onChange={set('expiry')}
          onBlur={blur('expiry')}
          aria-invalid={!!show('expiry')}
          aria-describedby={show('expiry') ? 'expiry-error' : undefined}
        />
        {err('expiry-error', show('expiry'))}
      </div>

      {submitError && (
        <p className="banner-error" role="alert">
          {submitError}
        </p>
      )}

      <button type="submit" className="primary">
        Create link
      </button>
    </form>
  );
}
