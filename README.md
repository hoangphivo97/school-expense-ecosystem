# School Expense Ecosystem (校園經費與支出審批生態系統)

[![Nx Monorepo](https://img.shields.io/badge/Nx-Monorepo-blue?logo=nx)](https://nx.dev/)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031?logo=angular)](https://angular.dev/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-ea2845?logo=nestjs)](https://nestjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%26%20Functions-ffca28?logo=firebase)](https://firebase.google.com/)

[**English**](#english-version) | [**繁體中文（台灣）**](#繁體中文版本台灣)

---

## English Version

### 1. Overview & Academic Context
The **School Expense Ecosystem** is an enterprise-oriented financial governance platform designed for universities to manage departmental budgets, multi-tiered expense approvals, and activity-based project funds. 

Developed as a Master's degree thesis and graduation capstone project, this platform explores architectural patterns for high-reliability administrative workflows, domain separation, and cross-framework micro front-end integration.

- **Live Demo:** [https://expense-tracker-web-app-7c1d1.web.app/](https://expense-tracker-web-app-7c1d1.web.app/)
- **Target Architecture Specification:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Current Capability Completion Matrix:** [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- **Technical Roadmap & Future Expansions:** [`FUTURE_EXPANSIONS.md`](./FUTURE_EXPANSIONS.md)

---

### 2. Architectural Design & Engineering Rationale

#### A. Cross-Framework Micro Front-End (MFE) Strategy
The frontend uses Webpack Module Federation inside an Nx Monorepo:
* **Host Shell (`mfe-shell-angular`):** Powered by Angular 22, managing application bootstrap, global RBAC/ABAC routing guards, design system layout, and core administrative flows using Angular Signals.
* **Remote Micro-App (`mfe-remote-react`):** Powered by React 19, integrated at runtime as a federated micro-frontend.

**Why this architectural approach was chosen:**
1. **Architectural Spike / Proof-of-Concept (PoC):** Verifies runtime interoperability between distinct frameworks (Angular 22 and React 19). The current implementation federates a theme management widget (`DarkModeToggle`) to demonstrate successful script chunk streaming, React DOM mounting inside an Angular component lifecycle, and style/context encapsulation.
2. **Organizational Scalability (Team Topologies):** Eliminates single-framework vendor lock-in. In university or enterprise IT settings, talent pools are often divided across Angular and React. This architecture decouples feature modules so independent frontend teams can develop, test, and release domain sub-apps (such as financial visualization dashboards or student portals) without coupling to the host framework.
3. **Domain Migration Roadmap:** Serves as the structural foundation for progressively migrating data visualization and student-facing widgets into autonomous React sub-apps.

#### B. Modular Monolith Backend
* **NestJS Server Engine:** Deployed as an optimized Google Cloud Function v2 (`onRequest`) via Firebase Functions.
* **Ports & Adapters (Hexagonal Architecture):** Domain services interact strictly with abstract repository interfaces (`ProjectRepository`, `ExpenseRepository`, `AuthUserRepository`), allowing database engines (Cloud Firestore vs. relational SQL) to be substituted without mutating domain rules.

---

### 3. Current Implementation Status

This repository is **in active development**. To maintain academic rigor and transparency, the current implementation is benchmarked against the target architecture:

* **Implemented (Core Baseline):**
  * Nx 22 monorepo topology with strict library boundaries (`libs/*`).
  * Angular 22 Shell with Signals, `httpResource`, and route-level security guards.
  * Runtime Module Federation bridge with React 19 remote.
  * Firebase Authentication (Google OAuth + Email/Password) with internal JWT session issuance.
  * Project and event lifecycle management with join-code capacity locking.
  * Multi-step expense claim submission endpoints and audit logging.
* **In Progress / Refinement:**
  * Strict onboarding role validation and status gates for unapproved accounts.
  * Faculty budget rollback transactions upon project/event rejection.
  * Direct linkage between Expense claims and Project/Event budgets.
  * Alignment of pagination parameters (`pageToken` vs `page`) across UI and API.
  * CI automated quality gate (`lint`, `test`, `build`) before deployment.
* **Planned (Future Scope):**
  * Full two-phase budget reservation (Hold vs. Settlement).
  * Automated batch disbursement, cash counter slot booking, and Taiwan e-GUI invoice reconciliation.

For complete capability scores and detailed progress breakdowns, see [`CURRENT_STATE.md`](./CURRENT_STATE.md).

---

### 4. Workspace Topology

```text
school-expense-ecosystem/
├── apps/
│   ├── mfe-shell-angular/      # Host Shell: Routing, guards, layouts, core workflows
│   ├── mfe-remote-react/       # Remote Micro-App: Cross-framework federated components
│   ├── backend/                # Modular Monolith API (NestJS / Cloud Function v2)
│   └── backend-e2e/            # Backend integration test suite
├── libs/
│   ├── admin/                  # User directory & account management
│   ├── auth/                   # Authentication strategies, interceptors & guards
│   ├── dashboard/              # Analytics & status aggregates
│   ├── expenses/               # Expense claim domain & review workflows
│   ├── finance/                # Faculty budget allocation & fiscal ledgers
│   ├── projects/               # Projects, events & join-code domain
│   └── shared/                 # Shared UI primitives, types, tokens & Firestore adapters
├── firebase.json               # Cloud infrastructure deployment specifications
├── nx.json                     # Monorepo build and dependency graph rules
└── tsconfig.base.json          # TypeScript path aliases
```

---

### 5. Getting Started

#### Prerequisites
* **Node.js:** v22.x or later
* **Package Manager:** Yarn (`corepack enable` recommended)

#### Installation & Development
```bash
# Clone the repository
git clone https://github.com/hoangphivo97/school-expense-ecosystem.git
cd school-expense-ecosystem

# Install dependencies
yarn install

# Start all applications concurrently
yarn nx run-many -t serve

# Or run individual applications
yarn nx serve backend            # API runs at http://localhost:3000
yarn nx serve mfe-shell-angular  # Host Shell runs at http://localhost:4200
yarn nx serve mfe-remote-react   # Remote Widget runs at http://localhost:5000
```

#### Running Tests
```bash
# Execute unit tests across the workspace
yarn nx run-many -t test

# Run backend unit tests specifically
yarn nx test backend
```

---
---

## 繁體中文版本（台灣）

### 1. 專案概述與學術研究背景
**校園經費與支出審批生態系統 (School Expense Ecosystem)** 是一套專為大學與學術機構設計的現代化財務治理平台，涵蓋院系經費額度管控、多層級經費審批流轉以及學生活動專案預算管理。

本專案作為**碩士論文研究與畢業實作專案**，核心目的在於探討與實踐現代化軟體架構模式，包括高可靠性業務審批流程、領域驅動設計 (Domain-Driven Design) 的邊界劃分，以及**跨框架微前端 (Cross-Framework Micro Front-End)** 的整合策略。

- **線上展示環境 (Live Demo):** [https://expense-tracker-web-app-7c1d1.web.app/](https://expense-tracker-web-app-7c1d1.web.app/)
- **目標架構規格書:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **目前實作成熟度指標:** [`CURRENT_STATE.md`](./CURRENT_STATE.md)
- **技術演進與未來擴展規劃:** [`FUTURE_EXPANSIONS.md`](./FUTURE_EXPANSIONS.md)

---

### 2. 架構設計思維與技術選型論證

#### A. 跨框架微前端 (Cross-Framework MFE) 戰略考量
本系統前端採用 Nx Monorepo 結合 Webpack Module Federation：
* **宿主基座 Shell (`mfe-shell-angular`):** 採用 Angular 22 開發，負責全域路由防護 (Guards)、基於角色的存取控制 (RBAC/ABAC)、全站版型配置，以及以 Angular Signals 為核心的業務資料流。
* **遠端微應用 Remote (`mfe-remote-react`):** 採用 React 19 開發，於運行時 (Runtime) 透過 Module Federation 動態載入。

**架構選型動機與目標：**
1. **架構驗證與概念驗證 (Architectural Spike / PoC):** 驗證 Angular 22 與 React 19 兩大異質前端生態系在同一個畫面中的運行時共存機制。目前版本透過動態載入主題切換模組 (`DarkModeToggle`)，成功驗證了異質程式碼塊串流、React DOM 在 Angular 元件生命週期內的掛載機制，以及樣式與狀態的隔離防護。
2. **組織與團隊擴展性 (Organizational Scalability / Team Topologies):** 避免系統被單一前端技術框架綁死 (Vendor Lock-in)。在學校或企業開發環境中，工程人才常分布於 Angular 與 React 兩大領域。此架構使未來能夠根據技術專長分工，允許獨立的 React 團隊在不更動 Angular 核心 Shell 的前提下，自主開發並獨立部署特定子業務模組（例如財務視覺化儀表板或學生入口）。
3. **領域遷移演進藍圖:** 作為漸進式重構的基礎設施，未來可將複雜的數據視覺化 (ApexCharts) 與學生操作介面平滑遷移至 React 獨立子應用中。

#### B. 模組化單體後端 (Modular Monolith Backend)
* **NestJS 服務引擎:** 透過 Firebase Functions 部署為最佳化的 Google Cloud Function v2 (`onRequest`)。
* **連接埠與配接器架構 (Ports & Adapters / 六角架構):** 領域服務僅依賴抽象儲存庫介面 (`ProjectRepository`, `ExpenseRepository`, `AuthUserRepository`)，確保業務核心與具體的資料庫底層 (Cloud Firestore 或未來關聯式資料庫) 完全解耦。

---

### 3. 目前實作狀態說明

本專案處於**積極開發階段**。為維持學術研究的嚴謹性與真實性，目前程式碼完成度與目標架構有明確區隔：

* **已完成核心基礎設施 (Implemented):**
  * Nx 22 Monorepo 架構與嚴格的程式庫邊界劃分 (`libs/*`)。
  * Angular 22 宿主 Shell，包含 Signals 狀態、`httpResource` 與路由權限防護。
  * 與 React 19 Remote 應用之 Module Federation 運行時橋接機制。
  * Firebase 認證 (Google OAuth / 帳密) 與系統內部 JWT 會話簽發。
  * 專案與活動之建立、審核流程與加入碼 (Join-code) 配額防禦。
  * 費用報銷申請端點與基本稽核歷程 (Audit Log) 記錄。
* **進行中與修正項目 (In Progress):**
  * 註冊引導 (Onboarding) 嚴格角色校驗與未審核帳號的 API 存取限制。
  * 專案/活動遭拒絕時，院系預算 (Faculty Fund) 之原子化回退復原機制。
  * 費用申請與特定專案/活動預算額度的關聯校驗。
  * 前後端分頁參數與回應格式標準化 (`pageToken` 與 `page`)。
  * CI/CD 自動化品質門檻 (`lint`, `test`, `build`) 建置。
* **規劃中遠期藍圖 (Planned / Target Scope):**
  * 完整的兩階段預算預留與結算機制 (Budget Hold & Settlement)。
  * 批次撥款管理、實體櫃檯時段預約與台灣電子發票 (e-GUI) 對帳引擎。

詳細各業務模組完成度百分比，請參閱 [`CURRENT_STATE.md`](./CURRENT_STATE.md)。

---

### 4. 系統程式目錄拓撲

```text
school-expense-ecosystem/
├── apps/
│   ├── mfe-shell-angular/      # 宿主 Shell：路由、權限防護、版型與核心業務流程
│   ├── mfe-remote-react/       # 遠端微應用：跨框架聯邦模組
│   ├── backend/                # 模組化單體 API (NestJS / Cloud Function v2)
│   └── backend-e2e/            # 後端整合測試套件
├── libs/
│   ├── admin/                  # 使用者管理與目錄服務
│   ├── auth/                   # 身份認證、攔截器與防護守衛
│   ├── dashboard/              # 營運分析與數據聚合
│   ├── expenses/               # 經費報銷與單據審核流程
│   ├── finance/                # 院系預算分配與財務帳本
│   ├── projects/               # 專案、活動與加入碼領域
│   └── shared/                 # 共用 UI 元件、型別定義與 Firestore 配接器
├── firebase.json               # 雲端基礎設施部署設定
├── nx.json                     # Monorepo 建置與相依性圖譜規則
└── tsconfig.base.json          # TypeScript 路徑別名設定
```

---

### 5. 快速開始 (Getting Started)

#### 環境需求
* **Node.js:** v22.x 或更新版本
* **套件管理工具:** Yarn (建議執行 `corepack enable`)

#### 安裝與啟動服務
```bash
# 複製專案庫
git clone https://github.com/hoangphivo97/school-expense-ecosystem.git
cd school-expense-ecosystem

# 安裝相依套件
yarn install

# 同時啟動所有應用程式
yarn nx run-many -t serve

# 或個別啟動特定服務
yarn nx serve backend            # 後端 API 運行於 http://localhost:3000
yarn nx serve mfe-shell-angular  # 宿主 Shell 運行於 http://localhost:4200
yarn nx serve mfe-remote-react   # 遠端微模組 運行於 http://localhost:5000
```

#### 執行測試
```bash
# 執行工作區內所有單元測試
yarn nx run-many -t test

# 針對後端專案執行測試
yarn nx test backend
```
