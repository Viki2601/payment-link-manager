# Payment Links Manager

React + TypeScript + Vite merchant-dashboard feature: create payment links, list them with a derived status, and filter by status. Data is in memory (no backend).

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
- Status is derived at render time: **Paid** > **Expired** (expiry passed) > **Active**. A timer re-evaluates it every 15s.
- Mock "Mark as paid" button stands in for a payment callback. No edit/delete. Newest links first. No persistence across reloads.
- UI talks to a small service layer (`src/service.ts`), so an API client can replace it without UI changes.

## Structure
- `src/validation.ts` form rules · `src/status.ts` status + filter logic · `src/service.ts` in-memory store
- `src/components/` form and list · `e2e/` Playwright spec
