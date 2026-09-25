# Retro frontend

React 19 and TypeScript client for Retro. It contains the public marketplace, browser-local cart, authenticated buyer account, seller application flow, and seller listing/fulfillment workspace.

## Commands

```powershell
npm ci
npm run dev
npm run lint
npm test
npm run build
```

`VITE_API_BASE_URL` defaults to `/api`; during development Vite proxies that path to `http://localhost:8080`. Requests include credentials and the Spring Security CSRF header.

## Structure

- `src/routes`: active public, buyer, and seller route definitions
- `src/redux`: store and RTK Query API contracts
- `src/features`: cart, orders, and seller listing workflows
- `src/components`: reusable marketplace, layout, feedback, and UI components
- `src/main`: route-level buyer and seller screens
- `src/test`: shared Vitest/Testing Library setup
- `public/demo`: local demo imagery and source/license notes

Setup instructions, demo accounts, screenshots, and deployment limits are in the repository [README](../README.md).
