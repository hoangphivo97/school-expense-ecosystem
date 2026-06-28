# School Expense Ecosystem

An enterprise-grade, full-stack, distributed **Micro Front-End (MFE)** and **Domain-Driven Architecture** platform designed to manage institutional university budgets and multi-level expense approvals. 

Built inside an **Nx Monorepo Workspace**, the ecosystem coordinates a secure host environment, modular frontend micro-apps, and a decoupled, resilient NestJS cloud backend.

### Live: [Link Live](https://expense-tracker-web-app-7c1d1.web.app/) 
---

## 🏛️ Architectural & System Design

This platform enforces a strict **Role-Based Access Control (RBAC)** matrix across four distinct tiers of user hierarchy (Level 0 to Level 3) combined with real-time financial budget tracking denominated in New Taiwan Dollars (NTD/TWD).

### 🔑 Key Enterprise Features
*   **Federated Micro Front-Ends:** Angular controls the robust Shell host application (routing, global guards, UI layout), while React drives granular remote sub-apps (UI features, interactive dashboard widgets) seamlessly wrapped together using Webpack Module Federation.
*   **Immutable Financial Auditing:** Built-in decoupled infrastructure layer tracking system executors (`admin-executor`) and transaction logs asynchronously written to Cloud Firestore (`firebase-audit-log.repository`).
*   **Anti-Spam Security Firewall:** Defensive middleware filtering logic inside NestJS coupled with Firebase OAuth to immediately block unauthorized registration, isolate bad inputs with hard purges, and drop malicious attempts via an active database blacklist entry.
### Detail Diagram Link: [ARCHITECTURE](https://github.com/hoangphivo97/school-expense-ecosystem/blob/main/ARCHITECTURE.md)
---
 

## 📂 System Topology & Library Boundaries

The workspace uses an elegant Domain-Driven structure managed entirely by Nx. Pure business capabilities are isolated strictly into decoupled functional libraries (`libs/`), preventing dependency bleeding and optimizing computational cache hits during builds.

```text
school-expense-ecosystem/
├── 📱 apps/
│   ├── mfe-shell-angular/      # 🏠 Main Host Portal (Angular Shell, Guard, RBAC Routing)
│   ├── mfe-remote-react/       # 🧩 Remote Micro-App (React Features, Data Visualization)
│   ├── backend/                # ⚙️ Decoupled API Server Engine (NestJS App Engine)
│   ├── mfe-shell-angular-e2e/  # 🧪 End-to-End Test Suite for Host Layer (Cypress)
│   ├── mfe-remote-react-e2e/   # 🧪 End-to-End Test Suite for Remote Layer (Cypress)
│   └── backend-e2e/            # 🧪 Integration End-to-End Test Suite for Core APIs (Jest)
│
├── 📦 libs/
│   ├── 👥 admin/               # Administrative Business Context (User Lists, Controls)
│   ├── 🔐 auth/                # Identity & Security Engine (Guards, JWT Strategies, Interceptors)
│   ├── 📊 dashboard/           # Metrics & Aggregations Data Domain
│   ├── 💰 expenses/            # Expense Claim Workflows (Requests, File Compressors, Audits)
│   ├── 🏛️ finance/             # Fiscal Control Domain (Budget Allocation, Department Caps)
│   └── 🛠️ shared/              # Central System Infrastructure (Firestore Modules, Tokens, Core Cross-Cutting Utils)
│
├── firebase.json               # Cloud Resource Maps
├── nx.json                     # Smart Monorepo Graph Directives
├── package.json                # Explicit Workspace Manifest
└── tsconfig.base.json          # Root Inheritance Path Rules
```

## 🛠️ Technological Blueprints
```text
Frontend Ecosystem: Angular (22), React (v19), TypeScript(6.0), Native SCSS Modules, Angular Signals State Store, Webpack Module Federation, ApexCharts Engine.

Backend Ecosystem: NestJS Server Framework, Clean Architecture Core Patterns, Passport JWT Security, Custom Performance Throttlers.

Infrastructure & Tooling: Nx Workspace Orchestrator, Firebase Auth Provider, Cloud Firestore NoSQL Instance, Yarn Workspaces.

Verification Foundations: Jest for isolated Unit Testing, Cypress for browser-level behavioral Automation, Storybook for UI isolated component specification.

Hosting: FE - Firebase Hosting, BE - Firebase Functions
```

## 🚀 Execution & Vitals
Prerequisites
```text

### Prerequisites
- Node.js: v22.x or more.
- Nx CLI: yarn add nx (recommend).

```

##  Getting Started
  ### Start project using NX
  ```
  yarn nx run-many -t serve
  ```
  React run at: localhost:5000
  Angular run at: localhost:4200
  backend run at: localhost:3000

  ### Start each project (If you prefer)
  ```
  yarn nx serve backend
  yarn nx serve mfe-shell-angular
  yarn nx serve mfe-react-remote 
  ```
  For each new terminal

  ### Unit Test whole App
  ```
  yarn nx run-many -t test
  ```

  ### Unit test specific on backend
  ```
  yarn nx test backend
  ```
  ### E2E Test Angular App
  ```
  yarn nx e2e mfe-shell-angular-e2e
  ```

  ### run Storybook React Remote App
  ```
  yarn nx storybook mfe-remote-react
  ```

### Clone the repo

```
git clone https://github.com/hoangphivo97/school-expense-ecosystem.git
```

### Note
- This project is for learning & demonstration purposes only.
- Work in progress.
