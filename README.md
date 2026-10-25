# School Expense Ecosystem

An Nx monorepo project for managing institutional budgets and expense approvals. The system is **in active development**; some documented workflows are implemented, some are partial, and some remain planned.

## Current implementation status

- Implemented: Nx monorepo, Angular host shell, React remote widget, NestJS backend, core auth, projects/events, expense request endpoints.
- Partial: frontend integration, expense review workflow, tests, and CI automation.
- Planned/Target: full budget hold/settle reconciliation, payout/disbursement, and several documented Phase 2–4 features.

See `ARCHITECTURE.md` for the current-state architecture and roadmap.

## Architecture

- Backend: modular monolith NestJS app deployed as one Firebase Function v2.
- Frontend: Angular shell with Module Federation remote React widget.
- Persistence: Cloud Firestore, Firebase Auth, Firebase Storage.
- Libraries are organized by domain under `libs/`.

## System topology

```text
school-expense-ecosystem/
├── apps/
│   ├── mfe-shell-angular/      # Angular host shell
│   ├── mfe-remote-react/       # React remote widget
│   ├── backend/                # NestJS API
│   └── backend-e2e/            # Backend e2e suite
├── libs/
│   ├── admin/
│   ├── auth/
│   ├── dashboard/
│   ├── expenses/
│   ├── finance/
│   ├── projects/
│   └── shared/
├── firebase.json
├── nx.json
└── package.json
```

## Technology

- Frontend: Angular, React, TypeScript, SCSS, Module Federation.
- Backend: NestJS, Passport JWT, Firebase Admin SDK.
- Infrastructure: Nx, Firebase Auth, Firestore, Firebase Storage, Firebase Hosting/Functions.
- Testing: Jest, Cypress, Storybook where configured.

## Getting started

Prerequisites:

- Node.js v22.x or newer
- Yarn

Install and run:

```text
yarn install
yarn nx run-many -t serve
```

Individual apps:

```text
yarn nx serve backend
yarn nx serve mfe-shell-angular
yarn nx serve mfe-remote-react
```

Tests:

```text
yarn nx run-many -t test
yarn nx test backend
```

## Notes

- This project is for learning and demonstration purposes.
- Work in progress.
- Some older documentation described target architecture; `ARCHITECTURE.md` now separates current implementation from roadmap.
