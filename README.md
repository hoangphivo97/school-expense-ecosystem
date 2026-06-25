# School Expense Ecosystem

An enterprise-grade, full-stack, distributed **Micro Front-End (MFE)** and **Domain-Driven Architecture** platform designed to manage institutional university budgets and multi-level expense approvals. 

Built inside an **Nx Monorepo Workspace**, the ecosystem coordinates a secure host environment, modular frontend micro-apps, and a decoupled, resilient NestJS cloud backend.

---

## 🏛️ Architectural & System Design

This platform enforces a strict **Role-Based Access Control (RBAC)** matrix across four distinct tiers of user hierarchy (Level 0 to Level 3) combined with real-time financial budget tracking denominated in New Taiwan Dollars (NTD/TWD).

### 🔑 Key Enterprise Features
*   **Federated Micro Front-Ends:** Angular controls the robust Shell host application (routing, global guards, UI layout), while React drives granular remote sub-apps (UI features, interactive dashboard widgets) seamlessly wrapped together using Webpack Module Federation.
*   **Immutable Financial Auditing:** Built-in decoupled infrastructure layer tracking system executors (`admin-executor`) and transaction logs asynchronously written to Cloud Firestore (`firebase-audit-log.repository`).
*   **Anti-Spam Security Firewall:** Defensive middleware filtering logic inside NestJS coupled with Firebase OAuth to immediately block unauthorized registration, isolate bad inputs with hard purges, and drop malicious attempts via an active database blacklist entry.

---

## 🔄 Core Workflows

### User Lifecycle & Onboarding State Machine
The diagram below illustrates how public users authenticate via Firebase OAuth, transition through mandatory onboarding guards, and undergo administrative auditing before obtaining platform permissions.

```mermaid
flowchart TD
    %% Define Enterprise-grade Styles
    classDef actor fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef action fill:#ffffff,stroke:#37474f,stroke-width:1.5px;
    classDef state fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,stroke-dasharray: 4 4;
    classDef termination fill:#eceff1,stroke:#455a64,stroke-width:2px;

    %% System Actors Separated Individually
    Admin([👑 System Admin - Lv0])
    Finance([💼 Finance Dept - Lv1])
    Dean([🏛️ Department Dean - Lv2])
    EndUser([🎓 Student / Teacher / Staff - Lv3])

    %% Authentication Entry Point
    Start([Start: Access Platform]) --> Decision_Route{Identify User Level}

    %% Route A: Internal Roles (Lv0, Lv1, Lv2)
    Decision_Route -->|Pre-created: Lv0, Lv1, Lv2| Act_InternalAuth[Auth: Custom Email/Password<br>or Configured Google Auth]
    Act_InternalAuth --> ST_Active((State:<br>ACTIVE))

    %% Route B: Public Roles (Lv3)
    Decision_Route -->|Self-Registration: Lv3| Act_FirebaseAuth[Auth: Firebase Google OAuth]
    Act_FirebaseAuth --> Decision_Profile{Evaluate DB Account Status}
    
    %% Gatekeeper / Guard Logic (The Firewall)
    Decision_Profile -->|Status: ACTIVE| ST_Active
    Decision_Profile -->|Status: SUSPENDED| End_Block([System: Deny Access<br>Account Frozen])
    Decision_Profile -->|Status: REJECTED| End_Blacklist([System: Instant Firewall Block<br>Spam/Intruder Prevention])
    Decision_Profile -->|Status: PENDING_APPROVAL| End_Pending_Screen([Screen: Waiting Admin Approval])
    Decision_Profile -->|No Record Found| ST_Onboarding((State:<br>ONBOARDING))

    %% Onboarding Sub-flow (Lv3 Only)
    ST_Onboarding --> Act_FillForm[User: Fill Profile Data<br>Name, ID, Department]
    Act_FillForm --> Act_Submit[User: Submit for Approval]
    Act_Submit --> ST_Pending((State:<br>PENDING_APPROVAL))

    %% Admin Verification Matrix
    ST_Pending --> Act_AdminReview[Admin: Review Pending Queue]
    End_Pending_Screen -.->|Awaits Action| Act_AdminReview
    Act_AdminReview --> Decision_Approve{Admin Decision?}
    
    %% Scenario A & B Processing
    Decision_Approve -->|Scenario A: Input Error| Act_HardDelete[Action: Hard Delete<br>Purge from Firebase & Firestore] --> End_Purged([End: Record Erased<br>Email Released for Retry])
    
    Decision_Approve -->|Scenario B: Security Threat| Act_SoftDelete[Action: Soft Delete<br>Flag Status as REJECTED]
    Act_SoftDelete --> ST_Rejected((State:<br>REJECTED))
    ST_Rejected --> End_Blacklist

    Decision_Approve -->|Valid Application| Act_Approve[Action: Approve Account] --> ST_Active

    %% Post-Active Lifecycle Controls
    ST_Active --> End_Active([Proceed to Authorized Dashboard<br>via RBAC Matrix])
    ST_Active -.->|Administrative Sanction| Act_AdminSusp[Admin: Suspend Account] --> ST_Suspended((State:<br>SUSPENDED))
    ST_Suspended --> Act_AdminReactiv[Admin: Reactivate Account] --> ST_Active
    ST_Suspended --> End_Block

    %% Apply Styles
    class Admin,Finance,Dean,EndUser actor;
    class Act_InternalAuth,Act_FirebaseAuth,Act_FillForm,Act_Submit,Act_AdminReview,Act_Approve,Act_HardDelete,Act_SoftDelete,Act_AdminSusp,Act_AdminReactiv action;
    class ST_Onboarding,ST_Active,ST_Pending,ST_Suspended,ST_Rejected state;
    class Start,End_Active,End_Block,End_Blacklist,End_Purged,End_Pending_Screen termination;
```
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
Frontend Ecosystem: Angular (v18+), React (v18+), TypeScript, Native SCSS Modules, Angular Signals State Store, Webpack Module Federation, ApexCharts Engine.

Backend Ecosystem: NestJS Server Framework, Clean Architecture Core Patterns, Passport JWT Security, Custom Performance Throttlers.

Infrastructure & Tooling: Nx Workspace Orchestrator, Firebase Auth Provider, Cloud Firestore NoSQL Instance, Yarn Workspaces.

Verification Foundations: Jest for isolated Unit Testing, Cypress for browser-level behavioral Automation, Storybook for UI isolated component specification.
```

## 🚀 Execution & Vitals
Prerequisites
```text
Node.js: v18.x or higher

Yarn Workspace: npm install -g yarn (Required package manager)

Nx Workspace CLI: npm install -g nx (Highly recommended global utility)

```
