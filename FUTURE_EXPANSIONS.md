# Technical Roadmap & Future Architectural Expansions
# (技術演進藍圖與未來架構擴展)

[**English**](#english-version) | [**繁體中文（台灣）**](#繁體中文版本台灣)

---

## English Version

### 1. Purpose & Academic Scope
This document outlines the **future technical evolution** of the School Expense Ecosystem. While [`CURRENT_STATE.md`](./CURRENT_STATE.md) details current implementation milestones and [`ARCHITECTURE.md`](./ARCHITECTURE.md) establishes the core system design, this specification documents anticipated infrastructure transitions, non-functional scalability initiatives, and intelligent processing pipelines.

These expansions demonstrate how the foundational patterns established in this Master's thesis—specifically **Hexagonal Architecture (Ports & Adapters)** and **Cross-Framework Micro Front-Ends**—enable structural evolution without requiring destructive rewrites of core domain logic.

---

### 2. Architectural Pillars for Future Evolution

#### A. Database Migration: Cloud Firestore to Supabase (PostgreSQL ACID)
* **Rationale:** Financial and accounting systems inherently rely on relational integrity, strict transactional isolation (ACID), and complex ledger auditing. While NoSQL (Cloud Firestore) provides rapid prototyping and flexible document storage, scaling financial reconciliations benefits from relational schemas and Row-Level Security (RLS).
* **Implementation Strategy via Ports & Adapters:**
  ```text
  ┌────────────────────────────────────────────────────────┐
  │                 Core Domain Services                   │
  │           (ProjectService, ExpenseService)             │
  └───────────────────────────┬────────────────────────────┘
                              │ Depends strictly on Ports
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │              Abstract Repository Contracts             │
  │           (ProjectRepository, ExpenseRepository)       │
  └───────────────────────────┬────────────────────────────┘
                              │ Implemented by Adapters
              ┌───────────────┴───────────────┐
              ▼                               ▼
  ┌──────────────────────────────┐ ┌─────────────────────────────────────┐
  │ FirestoreProjectRepository   │ │ SupabaseProjectRepository           │
  │ (Current NoSQL Driver)       │ │ (Planned PostgreSQL ACID Adapter)   │
  └──────────────────────────────┘ └─────────────────────────────────────┘
  ```
* **Key Advantages:**
  * **Zero Business Mutation:** Swapping persistence engines is isolated to NestJS dependency injection provider tokens (`useClass: SupabaseProjectRepository`). Business controllers and domain rules remain completely untouched.
  * **Database-Level Concurrency:** Native PostgreSQL transactions, constraints (`CHECK`, `FOREIGN KEY`), and row-level locking replace Firestore document-level lock contention.
  * **Fine-Grained Security:** Direct client-side access can leverage Supabase Row-Level Security (RLS) driven by JWT claims.

---

#### B. Intelligent Receipt Ingestion Pipeline (Edge / Dedicated AI Processing)
* **Rationale:** Manual transcription of paper receipts and digital invoices introduces transcription errors, processing delays, and variance discrepancies. Integrating automated document understanding bridges the gap between physical receipts and digital expense submissions.
* **Proposed Architecture (Asynchronous AI Ingestion Pipeline):**
  ```mermaid
  sequenceDiagram
    autonumber
    actor Student as Student / Requester
    participant Client as Angular Shell UI
    participant Backend as NestJS API Gateway
    participant Storage as Cloud / Object Storage
    participant Queue as Asynchronous Job Queue
    participant AIPipeline as AI Processing Pipeline (e.g., K20Pro / Local Edge)
    participant DB as System Database

    Student->>Client: Upload receipt photo / e-GUI barcode
    Client->>Backend: Request secure upload URL
    Backend-->>Client: Presigned upload URL
    Client->>Storage: Direct binary stream upload
    Client->>Backend: Submit ingestion job (ImageRef)
    Backend->>Queue: Push AI analysis task (Webhook/PubSub)
    Backend-->>Client: Job ID (Status: PROCESSING)
    
    Queue->>AIPipeline: Dispatch raw image payload
    Note over AIPipeline: 1. Image enhancement & de-skewing<br/>2. OCR: Text & Digit Recognition<br/>3. Taiwan e-GUI Barcode/QR Parsing<br/>4. LLM/Vision Itemization Extraction
    AIPipeline-->>Backend: Callback / Webhook: Extracted DTO (Items, Amount, TaxID)
    Backend->>DB: Cache extraction draft
    Backend-->>Client: Push notification / Signal update (READY)
    Student->>Client: Review pre-populated fields & confirm submission
  ```
* **Technical Considerations:**
  * **Decoupled Compute:** Heavy OCR and vision model inference are offloaded to dedicated hardware (e.g., dedicated GPU server / local device node like K20Pro) via asynchronous queues (Redis/BullMQ or Pub/Sub), preventing CPU starvation on the main API server.
  * **Domain Pre-validation:** Extracted seller Tax IDs (Taiwan Unified Business Number / 統一編號) are automatically validated against government registries to flag unauthorized vendors before reaching the Teacher review stage.

---

#### C. Polyglot Micro Front-End Expansion (Independent Teams)
* **Next Steps for Webpack Module Federation:**
  1. **Analytics & Dashboard Micro-App:** Migrate the ApexCharts analytics view (`/report`) from the Angular shell into the autonomous `mfe-remote-react` workspace.
  2. **Student Portal Sub-App:** Scaffold a dedicated, lightweight student-facing remote focused on mobile responsiveness, join-code redemption, and receipt capture.
  3. **Shared Design Tokens:** Consolidate color systems, typography, and spacing variables into a framework-agnostic Tailwind or Web Components package consumed equally by Angular and React remotes.

---

#### D. Event-Driven Messaging & Audit Ledger
* **Transition from Synchronous DI to Event Outbox:**
  * Financial events (e.g., `BudgetCommitted`, `ExpenseAuthorized`, `FundsDisbursed`) published to an internal event bus.
  * Implementation of the **Transactional Outbox Pattern** to guarantee eventual consistency between transaction execution and external notifications (Slack/Email/SMS alerts to Department Deans).

---
---

## 繁體中文版本（台灣）

### 1. 文件目的與學術研究範疇
本文件旨在闡述校園經費與支出審批生態系統 (School Expense Ecosystem) 的**未來技術演進藍圖與非功能性擴展規劃**。相對於 [`CURRENT_STATE.md`](./CURRENT_STATE.md) 呈現當前實作進度，以及 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 定義目標規格，本文著眼於基礎設施升級、智慧化管線整合與架構彈性驗證。

本碩士論文專案所奠定的核心模式——特別是**六角架構 (Ports & Adapters / 連接埠與配接器)** 與**跨框架微前端 (Cross-Framework Micro Front-Ends)**——能確保系統在未來進行深度技術架構更替時，無須推翻或改寫既有的核心業務邏輯。

---

### 2. 未來技術擴展之核心支柱

#### A. 資料庫引擎遷移：從 Cloud Firestore 演進至 Supabase (PostgreSQL ACID)
* **演進背景:** 財務會計系統對於關聯性完整性 (Relational Integrity)、嚴格交易隔離層級 (ACID Transactions) 與多維度帳本對帳具有天然需求。NoSQL (Firestore) 具備快速原型驗證與即時監聽優勢，然而隨著交易規模與多階層預算審核的複雜化，關聯式資料庫結構與列級安全性 (Row-Level Security, RLS) 能提供更為穩固的架構支撐。
* **六角架構之無痛遷移機制:**
  * **業務邏輯零修改 (Zero Business Mutation):** 領域服務僅依賴抽象儲存庫合約 (`ProjectRepository`, `ExpenseRepository`)。更換底層資料庫驅動僅需在 NestJS 依賴注入模組中調整 Provider 繫結：
    ```typescript
    // 切換前 (Firestore Adapter)
    { provide: PROJECT_REPOSITORY_TOKEN, useClass: FirestoreProjectRepository }
    
    // 切換後 (Supabase / PostgreSQL Adapter)
    { provide: PROJECT_REPOSITORY_TOKEN, useClass: SupabaseProjectRepository }
    ```
  * **原生交易與約束機制:** 藉由 PostgreSQL 的 `FOREIGN KEY`、`CHECK` 約束與行級鎖 (`SELECT ... FOR UPDATE`)，徹底消除 NoSQL 環境下的分散式競態條件 (Race Conditions)。

---

#### B. 智慧單據前置處理管線 (Edge / 專屬 AI 影像辨識管線)
* **演進背景:** 現行流程仰賴申請者手動輸入發票明細與金額，容易衍生人工轉錄錯誤、發票抬頭不合規或預算超支等問題。導入自動化單據辨識管線，能於單據進入審批前自動完成資料結構化。
* **非同步 AI 前置處理架構設計:**
  ```text
  [學生端上傳發票照片 / e-GUI條碼]
               │
               ▼ (直傳雲端儲存)
      [Object Storage]
               │
               ▼ (非同步佇列觸發任務 / Webhook)
  [專屬 AI 處理節點 (例如 K20Pro / 地端推論伺服器)]
         ├── 1. 影像傾斜校正與畫質增強
         ├── 2. OCR 光學字元識別 (金額、日期、統編)
         ├── 3. 台灣電子發票 QR Code / 條碼解碼
         └── 4. 結構化欄位萃取 (品名清單、稅額計算)
               │
               ▼ (非同步回傳結構化 JSON)
     [NestJS 後端服務] ──> 自動預填至費用申請表單 ──> [學生確認並提交審查]
  ```
* **架構優勢:**
  * **算力負載隔離:** 繁重的影像辨識與模型推論運算獨立運作於專屬邊緣硬體 (如 K20Pro 推論管線) 或專用運算節點，避免阻塞 NestJS 主業務 API 服務之執行緒與記憶體。
  * **事前合規檢驗:** 系統於辨識出統一編號後，可即時介接經濟部公開資料庫驗證廠商合法性，提早阻擋不合格單據，大幅減輕系所秘書與會計審核之負擔。

---

#### C. 微前端跨團隊延伸 (Polyglot Micro Front-End Expansion)
* **遠端應用領域推進:**
  1. **財務數據分析子應用:** 將原 Shell 中的 ApexCharts 數據分析報表模組 (`/report`) 完整剝離，重構成獨立部署於 `mfe-remote-react` 的子應用。
  2. **學生端專用輕量入口 (Student Remote):** 專注於行動裝置適配、加入碼 (Join-code) 快速兌換與手機即時拍照報銷。
  3. **跨框架設計標籤 (Design Tokens):** 抽離全站顏色、間距、排版為框架無關的 Web Components / Tailwind 共享模組，維持 Angular 與 React 畫面風格之一致性。

---

#### D. 事件驅動架構 (Event-Driven Architecture) 與事務性發件箱 (Transactional Outbox)
* **解耦跨領域通訊:**
  * 當經費狀態流轉 (如 `EXPENSE_APPROVED`) 發生時，透過領域事件 (Domain Events) 廣播，驅動異步通知服務與稽核快照建立。
  * 導入 **Transactional Outbox 模式**，確保資料庫狀態更新與外部通知 (Email / Slack / 簡訊通知院長審批) 具備最終一致性 (Eventual Consistency)。
