# Payment Links Manager

React + TypeScript + Vite merchant-dashboard feature: create payment links, record full or partial payments, list them with a derived status, and filter by status. Data persists in browser localStorage (no backend).

## Install
```bash
npm install
npx playwright install chromium
```

## Run
```bash
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Test
```bash
npm test         # Vitest + Testing Library (validation, status logic, UI flow)
npm run e2e      # Playwright (starts the dev server automatically)
```

## Assumptions
- INR only. Amounts are stored as integer paise and displayed with `en-IN` formatting.
- Valid contact: an email, or a 10-digit Indian mobile number (optional `+91`). At least one is required; any value entered must be valid.
- Expiry is optional, entered in local time, and must be strictly in the future.
- Partial payments are optional; when enabled, the first payment must meet the configured minimum. Payments are tracked as integer paise and cannot exceed the remaining due.
- Status is derived at render time: **Paid** > **Expired** > **Partially paid** > **Active**. A timer re-evaluates it every 15s.
- Link data is persisted under a versioned localStorage key; legacy `paid` flags are migrated to a paid-total amount. No edit/delete. Newest links first.
- UI talks to a small service layer (`src/service.ts`), so an API client can replace it without UI changes.

## Structure
- `src/validation.ts` form rules · `src/status.ts` status + filter logic · `src/service.ts` persistent store
- `src/components/` form and list · `e2e/` Playwright spec
