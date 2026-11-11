# Project Guidelines

- Store and calculate money as integer paise only; never use floating-point values for monetary amounts.
- Derive payment-link status only in `src/status.ts`; never persist status. Precedence is **Paid > Expired > Partially paid > Active**.
- Route all data access through the service layer. UI components must not access `localStorage` directly.
- Any change to the persisted data shape requires a storage version bump and a migration for existing data.
- Before reporting work as done, run `tsc --noEmit`, `npm test`, and `npm run e2e`, and report their actual results.
