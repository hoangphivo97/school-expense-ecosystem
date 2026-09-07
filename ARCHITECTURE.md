### 📑 Core Modules Flowcharts

<details>
<summary><b>1.User Management Business Logic Flowchart (Click to expand)</b></summary>
  
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
</details>

<details>
<summary><b>2.Business Logic Flowchart for Expense Management & Payout Lifecycle  (Click to expand)</b></summary>
  
```mermaid
flowchart TD
%% Style definitions
classDef action fill:#ffffff,stroke:#37474f,stroke-width:1.5px;
classDef state fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,stroke-dasharray: 4 4;
classDef condition fill:#eceff1,stroke:#455a64,stroke-width:1.5px;
classDef success fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
classDef reject fill:#ffebee,stroke:#c62828,stroke-width:1.5px;

%% ==========================================
%% SUBGRAPH 1: PROJECT & EVENT MODULE
%% ==========================================
subgraph Project_Event_Module ["🏢 PROJECT & EVENT CREATION & BUDGET ALLOCATION"]
    PE_Start([🚀 Create Project / Event]) --> PE_TypeCheck{"Entity Type?"}
    
    %% Project Path
    PE_TypeCheck -->|"PROJECT"| P_FundCheck{"Funding Type?"}
    P_FundCheck -->|"OUTSOURCE"| P_Active["Set ACTIVE (Zero School Cap)"]
    P_FundCheck -->|"FACULTY"| P_DeanReview{"Dean Review"}
    P_FundCheck -->|"SCHOOL"| P_CreatorCheck{"Creator Role?"}
    
    P_CreatorCheck -->|"Is DEAN"| ST_Proj_FinAuth(("State:<br/>PENDING_FINANCE_APPROVAL"))
    P_CreatorCheck -->|"Is TEACHER/STAFF"| ST_Proj_DeanAuth(("State:<br/>PENDING_DEAN_APPROVAL"))
    
    ST_Proj_DeanAuth --> P_DeanReview
    P_DeanReview -->|"Reject"| ST_Proj_Reject(("State: REJECTED"))
    P_DeanReview -->|"Approve"| ST_Proj_FinAuth
    
    ST_Proj_FinAuth --> P_FinReview{"Finance Audit &<br/>Budget Allocation"}
    P_FinReview -->|"Reject"| ST_Proj_Reject
    P_FinReview -->|"Approve"| P_LockFund["DB Transaction:<br/>Allocate School Budget Balance"] --> ST_Proj_Active(("State:<br/>ACTIVE"))
    
    %% Event Path
    PE_TypeCheck -->|"EVENT"| E_Binding{"Is Linked to Project?"}
    E_Binding -->|"Yes (PROJECT Fund)"| E_CapCheck{"Check Parent Project<br/>Available Balance"}
    E_CapCheck -->|"Exceeds"| ST_Proj_Reject
    E_CapCheck -->|"Valid"| E_DeanCheck{"Dean Approval"}
    E_Binding -->|"No (SCHOOL / FACULTY)"| P_FundCheck
    E_DeanCheck -->|"Approve"| ST_Event_Active(("State: ACTIVE / UPCOMING"))
end

%% ==========================================
%% SUBGRAPH 2: REFUND REQUEST LIFECYCLE (2 PHASES)
%% ==========================================
subgraph Refund_Request_Lifecycle ["📑 PROCUREMENT & REFUND STATE MACHINE"]
    Req_Start([🧑‍🎓 Student/Staff Creates Request]) --> Guard_Member{"Guard Check:<br/>User belongs to<br/>Active Project/Event?"}
    Guard_Member -->|"No"| Act_Deny["403 Forbidden: Join Project First"]
    
    Guard_Member -->|"Yes"| Act_DraftItems["Fill Procurement Form:<br/>1. Input List of Items (Qty, Est. Price)<br/>2. Compute Total Estimated TWD"]
    Act_DraftItems --> Act_SubmitDraft["Submit Request"] --> ST_PendingDraft(("State:<br/>PENDING_TEACHER_REVIEW"))
    
    %% Phase 1: Teacher Draft Approval
    ST_PendingDraft --> Decision_Teacher{"Teacher / Advisor Review:<br/>Are items valid & reasonable?"}
    Decision_Teacher -->|"Reject / Modify"| ST_DraftRevise(("State:<br/>REVISION_REQUIRED"))
    ST_DraftRevise --> Act_DraftItems
    
    %% Phase 2: Dean Approval & Budget Hold
    Decision_Teacher -->|"Approve"| ST_PendingDean(("State:<br/>PENDING_DEAN_APPROVAL"))
    ST_PendingDean --> Decision_Dean{"Dean Review:<br/>Check Activity Budget Cap"}
    Decision_Dean -->|"Reject"| ST_Req_Reject(("State:<br/>BUDGET_REJECTED"))
    
    Decision_Dean -->|"Approve"| Act_HoldBudget["DB Transaction:<br/>Hold Estimated Budget on Activity<br/>(hold_balance += EstAmount)"]
    Act_HoldBudget --> ST_AuthPurchase(("State:<br/>AUTHORIZED_FOR_PURCHASE"))
    
    %% Phase 3: Student Purchases & Bill Upload
    ST_AuthPurchase --> Act_StudentBuy["🏃 Student Purchases Physical Items<br/>Obtains Taiwan e-GUI Invoice"]
    Act_StudentBuy --> Act_UploadInvoice["Student Uploads Bill &<br/>Updates Actual Spent Amount"]
    
    Act_UploadInvoice --> Act_eGUIEngine["e-GUI Engine Scan:<br/>1. Verify Unique (Inv_No, Date)<br/>2. School Tax ID 04126516 Check<br/>3. Hex-to-Dec Amount Parsing"]
    
    Act_eGUIEngine --> Decision_BillValid{"Bill Valid &<br/>Actual <= Estimated?"}
    Decision_BillValid -->|"Mismatch / Exceeded"| Act_FlagVariance["Flag Variance for Finance Audit"] --> ST_PendingAudit
    Decision_BillValid -->|"Pass Valid"| ST_PendingAudit(("State:<br/>PENDING_FINANCE_APPROVAL"))
    
    %% Phase 4: Finance Settlement
    ST_PendingAudit --> Decision_Finance{"Finance Final Audit:<br/>1. Verify Items vs Invoice<br/>2. Audit Variance"}
    Decision_Finance -->|"Fraud / Invalid"| Act_ReleaseHold["DB Transaction: Unfreeze Hold"] --> ST_Req_Reject
    Decision_Finance -->|"Approve"| Act_ReconcileBudget["DB Transaction:<br/>1. Release Delta: (Est - Actual)<br/>2. Deduct Actual TWD from Project Balance"]
    Act_ReconcileBudget --> ST_PendingDisburse(("State:<br/>PENDING_DISBURSEMENT"))
end

%% ==========================================
%% SUBGRAPH 3: PAYOUT ENGINE
%% ==========================================
subgraph Payout_Module ["🏦 PAYOUT EXECUTION"]
    ST_PendingDisburse --> Decision_PayMethod{"Payout Method"}
    
    %% CASH
    Decision_PayMethod -->|"CASH"| Act_BookAtomicSlot["Atomic DB Lock Booking<br/>(Quota < 100)"]
    Act_BookAtomicSlot --> ST_CashBooked(("State: CASH_SLOT_BOOKED"))
    ST_CashBooked --> Act_CashDesk["Present Paper Bill at Counter<br/>➔ Stamp 'PAID' ➔ Disburse Cash"] --> ST_Disbursed
    
    %% BANK TRANSFER
    Decision_PayMethod -->|"BANK_TRANSFER"| Act_BatchTransfer["Export Bank Wire Batch"]
    Act_BatchTransfer --> Decision_BankRecon{"Bank Recon Report"}
    Decision_BankRecon -->|"Success"| ST_Disbursed(("State:<br/>DISBURSED"))
    Decision_BankRecon -->|"Failed"| ST_BankFail(("State: PAYMENT_FAILED"))
    ST_BankFail --> Act_FixBank["Student Updates Bank Details"] --> ST_PendingDisburse
end

ST_Disbursed --> End_Success([🏁 End: Activity Ledger Closed])

%% Connections & States
ST_Req_Reject --> ST_FinalReject((State: REJECTED))

%% Styling
class Act_DraftItems,Act_SubmitDraft,Act_HoldBudget,Act_StudentBuy,Act_UploadInvoice,Act_eGUIEngine,Act_FlagVariance,Act_ReconcileBudget,Act_BookAtomicSlot,Act_CashDesk,Act_BatchTransfer,Act_FixBank,P_LockFund,P_Active action;
class ST_Proj_DeanAuth,ST_Proj_FinAuth,ST_Proj_Active,ST_Event_Active,ST_PendingDraft,ST_PendingDean,ST_AuthPurchase,ST_PendingAudit,ST_PendingDisburse,ST_CashBooked,ST_BankFail,ST_DraftRevise state;
class Decision_Teacher,Decision_Dean,Decision_BillValid,Decision_Finance,Decision_PayMethod,Decision_BankRecon,P_FundCheck,P_CreatorCheck,P_DeanReview,P_FinReview,E_Binding,E_CapCheck,E_DeanCheck,Guard_Member condition;
class ST_Disbursed,End_Success success;
class ST_Req_Reject,ST_FinalReject,ST_Proj_Reject,Act_Deny,Act_ReleaseHold reject;

```

</details>

<details>
<summary><b>3. High-level Architectural Block Diagram (Click to expand)</b></summary>
  
```mermaid
graph TB
    %% Define DDD Architecture Styles
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:1.5px;
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1.5px;
    classDef shared fill:#fffde7,stroke:#fbc02d,stroke-width:1.5px;
    classDef infra fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    
    %% STRICT DATA ABSTRACTION LAYER CLASS (The Interface/Repository boundaries)
    classDef data_abstraction fill:#e0f2f1,stroke:#004d40,stroke-width:2.5px;
    
    %% Styled specifically for planned components to signal Phase 2 Roadmap
    classDef planned fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1.5px,stroke-dasharray: 5 5;

    subgraph Workspace_Monorepo ["📦 NX MONOREPO WORKSPACE BOUNDARY (Enterprise Scale)"]
        
        %% --- FRONTEND CONTEXTS LAYER ---
        subgraph FE_Layer ["🖥️ FRONTEND LAYER (Domain-Driven Micro-Frontends)"]
            App_Shell["mfe-shell-angular<br/>(Angular Host Application)"]
            App_Remote["mfe-remote-react<br/>(React Remote Application)"]
            
            subgraph Expense_FE ["📦 EXPENSES BOUNDED CONTEXT"]
                FE_Exp_Feature["features<br/>(Smart Components / List & Modals)"]
                FE_Exp_DA["data-access<br/>(State Management & Angular Services)"]
            end
            
            subgraph Payout_FE ["📦 PAYOUT BOUNDED CONTEXT (Planned - Phase 2)"]
                FE_Pay_Feature["features<br/>(Batch Management Dashboard)"]
                FE_Pay_DA["data-access<br/>(Reconciliation Services)"]
            end
            
            subgraph Auth_FE ["📦 AUTH BOUNDED CONTEXT"]
                FE_Auth_Feature["features<br/>(Login & Route Guards)"]
                FE_Auth_DA["data-access<br/>(Signals Store / Auth State)"]
            end
            
            subgraph Finance_FE ["📦 FINANCE BOUNDED CONTEXT"]
                FE_Fin_Feature["features<br/>(Budget Manager Components)"]
                FE_Fin_DA["data-access<br/>(Budget HTTP Services)"]
            end
        end

        %% --- BACKEND CONTEXTS LAYER ---
        subgraph BE_Layer ["⚙️ APPLICATION LOGIC LAYER (NestJS Backend - apps/backend)"]
            subgraph Expense_BE ["📦 EXPENSES BACKEND DOMAIN"]
                BE_Exp_Ctrl["features-backend<br/>(Expense Controller Layer)"]
                BE_Exp_Service["data-access-backend<br/>(Domain Services & Tx Logic)"]
                BE_Exp_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>Repository Interface Contract]"]
            end
            
            subgraph Payout_BE ["📦 PAYOUT BACKEND DOMAIN (Planned - Phase 2)"]
                BE_Pay_Ctrl["features-backend<br/>(Payout Batch Controller)"]
                BE_Pay_Service["data-access-backend<br/>(Bulk Transfer & PDF Parsing Logic)"]
                BE_Pay_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>Storage Repository Contract]"]
            end
            
            subgraph Auth_BE ["📦 AUTH BACKEND DOMAIN"]
                BE_Auth_Ctrl["features-backend<br/>(Auth Controller & JWT Guards)"]
                BE_Auth_Service["data-access-backend<br/>(Session & Claims Services)"]
                BE_Auth_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>Identity Provider Interface]"]
            end
            
            subgraph Finance_BE ["📦 FINANCE BACKEND DOMAIN"]
                BE_Fin_Ctrl["features-backend<br/>(Budget Controller Layer)"]
                BE_Fin_Service["data-access-backend<br/>(TWD Budget Allocation Logic)"]
                BE_Fin_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>Budget Repository Contract]"]
            end
        end

        %% --- SHARED KERNEL ---
        subgraph Shared_Kernel ["💛 SHARED KERNEL (libs/shared/*)"]
            Shared_UI["ui & ui-react<br/>(Design System / DarkModeToggle)"]
            Shared_Tokens["tokens<br/>(Injection Tokens & Configuration)"]
            Shared_Types["types<br/>(Global Enums & Shared Interfaces)"]
        end
    end

    %% --- INFRASTRUCTURE ADAPTERS LAYER (Can be easily swapped out thanks to Repositories)
    subgraph Infrastructure ["🗄️ INFRASTRUCTURE ADAPTERS LAYER (Swappable Providers)"]
        FB_Auth["Firebase Authentication Adapter<br/>(Identity Service Gateway)"]
        Firestore[("Firebase Firestore Adapter<br/>(NoSQL Bounded Collections)")]
        Storage[("Firebase Cloud Storage Adapter<br/>(GUI Receipts & Master PDFs)")]
        BankBOT[["Bank of Taiwan App<br/>(Offline File-Based Clearing)"]]
    end

    %% Core Internal Backend Connections (Decoupled via Repositories)
    BE_Exp_Ctrl --> BE_Exp_Service
    BE_Exp_Service -->|"Calls Interface"| BE_Exp_Repo
    BE_Auth_Ctrl --> BE_Auth_Service
    BE_Auth_Service -->|"Calls Interface"| BE_Auth_Repo
    BE_Fin_Ctrl --> BE_Fin_Service
    BE_Fin_Service -->|"Calls Interface"| BE_Fin_Repo
    BE_Pay_Ctrl --> BE_Pay_Service
    BE_Pay_Service -->|"Calls Interface"| BE_Pay_Repo

    %% Frontend Apps Dependencies
    App_Shell -->|"Injects Features"| FE_Exp_Feature
    App_Shell -->|"Injects Features"| FE_Auth_Feature
    App_Shell -->|"Injects Features"| FE_Fin_Feature
    App_Shell -->|"Injects Features (Future)"| FE_Pay_Feature
    App_Remote -->|"Exposes Layout Feature"| App_Shell
    
    %% Tactical Layering Connections (Feature -> Data Access)
    FE_Exp_Feature --> FE_Exp_DA
    FE_Auth_Feature --> FE_Auth_DA
    FE_Fin_Feature --> FE_Fin_DA
    FE_Pay_Feature --> FE_Pay_DA
    
    %% REST API Network Boundaries
    FE_Exp_DA -->|"HTTPS REST API<br/>(JWT + App Check)"| BE_Exp_Ctrl
    FE_Auth_DA -->|"HTTPS REST API<br/>(JWT + App Check)"| BE_Auth_Ctrl
    FE_Fin_DA -->|"HTTPS REST API<br/>(JWT + App Check)"| BE_Fin_Ctrl
    FE_Pay_DA -->|"HTTPS REST API (Future)"| BE_Pay_Ctrl
    
    %% Core Async Communication between Domains (Decoupling)
    BE_Exp_Service -.->|"Triggers State Mutation Event"| BE_Pay_Ctrl
    
    %% Infrastructure Adapters Implementations (Bound STRICTLY to Repositories, NOT Services)
    BE_Exp_Repo -->|"Plugs Into"| Firestore
    BE_Exp_Repo -->|"Plugs Into"| Storage
    BE_Fin_Repo -->|"Plugs Into"| Firestore
    BE_Pay_Repo -.->|"Plugs Into"| Storage
    BE_Auth_Repo -->|"Plugs Into"| FB_Auth
    FE_Auth_DA -.->|"Direct Client Verification"| FB_Auth
    
    %% Shared Kernel Core Connections
    Shared_Types -.->|"Provides Contracts"| FE_Exp_DA
    Shared_Types -.->|"Provides Contracts"| BE_Exp_Ctrl
    Shared_UI -.->|"Provides Presentation Atoms"| App_Shell

    %% External System Boundary
    BE_Fin_Ctrl -.->|"Generates Batch Export Excel"| BankBOT
    BE_Pay_Service -.->|"Processes Bank Transfers (Future)"| BankBOT

    %% Apply DDD Architecture Styles to Nodes
    class App_Shell,App_Remote,FE_Exp_Feature,FE_Exp_DA,FE_Auth_Feature,FE_Auth_DA,FE_Fin_Feature,FE_Fin_DA client;
    class BE_Exp_Ctrl,BE_Exp_Service,BE_Auth_Ctrl,BE_Auth_Service,BE_Fin_Ctrl,BE_Fin_Service backend;
    class Shared_UI,Shared_Tokens,Shared_Types shared;
    class FB_Auth,Firestore,Storage,BankBOT infra;
    
    %% HIGHLIGHTING THE ACTUAL DATA ABSTRACTION LAYER (THE REPOSITORIES CONTRACTS)
    class BE_Exp_Repo,BE_Auth_Repo,BE_Fin_Repo data_abstraction;
    
    %% Apply Planned Roadmap Styles (Overriding for Phase 2 components)
    class FE_Pay_Feature,FE_Pay_DA,BE_Pay_Ctrl,BE_Pay_Service,BE_Pay_Repo planned;
```

</details>
<details>
<summary><b>4. Firestore NoSQL Data Model Diagram (Click to expand)</b></summary>
  
```mermaid
erDiagram
    USERS {
        string id PK "uid (Firebase Auth)"
        string username "Optional"
        string fullName "Required"
        string role "Role Enum: STUDENT | TEACHER | DEAN | FINANCE | ADMIN"
        string email "Institutional Email"
        string facultyId "FacultyId Enum"
        string userType "UserType Enum"
        string userCode "Unique Academic/Staff ID"
        string dateOfBirth "Required"
        string status "UserStatus Enum"
        date createdAt "ISO String Timestamp"
        string reason "Onboarding Rejection Reason"
    }

    EXPENSES {
        string id PK "Auto-generated Document UUID"
        string expenseCode UK "EXP-[FACULTY]-[MMYY]-[CRYPTO]"
        string userId FK "Links to USERS.id"
        string requesterCode "userCode at submission"
        string requesterName "fullName at submission"
        string facultyId "FacultyId Enum"
        number amount "Reimbursement Value (TWD)"
        string purpose "Statement of Purpose"
        string description "Detailed Field Notes"
        string status "ExpenseStatus Enum"
        string paidMethod "PaidMethod Enum"
        string date "Target Appointment / Expense Date (Timestamp)"
        string appointmentStatus "AppointmentStatus Enum"
        array_string proofUrls "Cloud Storage References"
        string requesterType "UserType Enum"
        string rejectReason "Optional"
        string createdAt "ISO String Timestamp"
        string updatedAt "ISO String Timestamp"
    }

    EXPENSE_AUDIT_LOGS {
        string id PK "Auto-generated Log UUID"
        string expenseId FK "Links to EXPENSES.id"
        string expenseCode "Cached for fast global lookup"
        string actorId FK "Links to USERS.id"
        string actorCode "Actor employee/student code"
        string actorName "Actor full name"
        string actorRole "Role Enum at time of action"
        string actorType "UserType Enum at time of action"
        string action "AuditAction: SUBMIT | RESUBMIT | APPROVE | REJECT | DISBURSE"
        string status "Resulting ExpenseStatus Enum"
        string rejectReason "Mandatory on REJECT operations"
        string createdAt "ISO String Timestamp"
        string facultyId "FacultyId Enum"
    }

    PAYOUTS {
        string id PK "payoutId (Auto-generated UUID)"
        string payoutCode UK "PAY-[MMYY]-[CRYPTO]"
        array_string targetExpenses "Array of linked Expense IDs"
        string payoutDate "Reconciliation Date"
        string payoutType "PaidMethod Enum"
        string proofUrl "Master Bank Receipt PDF URL"
        string reason "Reconciliation Notes"
        string status "PayoutStatus Enum"
        string createdAt "ISO String Timestamp"
        string updatedAt "ISO String Timestamp"
    }

    BUDGET_CAPS {
        string id PK "Document ID equals facultyId"
        number totalBudget "Total Static Envelope"
        number frozenAmount "Encumbered Funds"
        number availableAmount "Spendable Balance"
        string createdAt "ISO String Timestamp"
        string updatedAt "ISO String Timestamp"
    }

    ADMIN_LOGS {
        string id PK "Auto-generated Log UUID"
        string actorId FK "Links to USERS.id (ADMIN UID)"
        string actorCode "Admin employee code"
        string actorName "Admin full name"
        string action "AdminAction: USER_APPROVE | USER_REJECT | USER_STATUS_CHANGE"
        string targetUserId "UID of the affected user being managed"
        string description "Semantic detail"
        string createdAt "ISO String Timestamp"
    }

    USERS ||--o{ EXPENSES : "submits"
    EXPENSES ||--o{ EXPENSE_AUDIT_LOGS : "generates"
    USERS ||--o{ EXPENSE_AUDIT_LOGS : "performs"
    BUDGET_CAPS ||--o{ EXPENSES : "allocates_funds_for"
    PAYOUTS ||--o{ EXPENSES : "reconciles_and_disburses"
    USERS ||--o{ ADMIN_LOGS : "executes_user_administrative_action"
```

</details>

<details>
  <summary><b>5. Technical Project Roadmap (Click to expand)</b></summary>
  
```mermaid
graph TD
    %% Style Definitions
    classDef phase1 fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1.5px,stroke-dasharray: 4 4;
    classDef phase2 fill:#e3f2fd,stroke:#1565c0,stroke-width:1.5px;
    classDef phase3 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef phase4 fill:#fff8e1,stroke:#ffb300,stroke-width:1.5px;

    %% Phases
    subgraph P1 ["🌱 PHASE 1: CLIENT-SIDE MONOLITH (13 Oct 2024 - May 27, 2025)"]
        M1["- Developed purely on Frontend using Angular 18<br/>- Utilized direct client-to-database integration with Firebase<br/>- Implemented basic personal Expense CRUD and native Firebase Auth"]
    end

    subgraph P2 ["🔧 PHASE 2: WORKSPACE OVERHAUL & MODERNIZATION (Jul 5, 2025 - Jun 5, 2026)"]
        M2["- Migrated codebase to an Nx Monorepo workspace ('micro-expense-tracker-personal')<br/>- Added NestJS backend layer operating on a hybrid MongoDB + Firebase infrastructure<br/>- Fabricated core UI elements and integrated initial React-wrapped SVG Chart components<br/>- <b>Late-Phase Architectural Shifts:</b> Dropped MongoDB; upgraded to Angular 22; shifted RxJS to native Signals; built Abstraction Layers"]
    end

    subgraph P3 ["🎯 PHASE 3: INSTITUTIONAL ECOSYSTEM PIVOT (Jun 6, 2026 - Present)"]
        M3["- Spawned current 'school-expense-ecosystem' repo; refactored scope to University Budget Management<br/>- Enforced Monorepo boundaries using explicit Nx Dependency Tags (project.json)<br/>- Hardened full-stack security via JWT Custom Claims, NestJS Throttling, and Firebase App Check<br/>- Fully deprecated Akita state management in favor of native Angular Signals Store<br/>- Engineered multi-role workflows, onboarding/rejection pipelines, and Admin user provisioning<br/>- <i>Isolated the decoupled Report charts for downstream synchronization</i>"]
    end

    subgraph P4 ["🚀 PHASE 4: ENTERPRISE HARDENING, LOCALIZATION & QA (Planned / Future Backlog)"]
        M4["- <b>1. Expense Specification Alignment:</b> Refine core validation to intercept duplicate tax invoices and verify vendor compliance data<br/>- <b>2. Downstream Report Refactoring:</b> Re-engineer Report Chart bindings to seamlessly consume finalized institutional Expense schemas<br/>- <b>3. Budget Ledger & Payout Realization:</b> Code transactional ledger workflows and state machines to manage atomic balance freezing and bulk bank reconciliations<br/>- <b>4. Cash Payout Appointment Scheduling:</b> Build capacity-controlled slot booking components and background Midnight Cron Jobs to release expired slots<br/>- <b>5. Cross-Border Internationalization & Localization (i18n):</b> Integrate Angular i18n / Transloco to support Traditional Chinese (zh-TW) and localize currency formats (TWD) for Taiwanese academic standards<br/>- <b>6. Automated Testing Suite:</b> Write Jest unit/integration tests for NestJS controllers and Cypress E2E test scripts for multi-role workflows"]
    end

    %% Flow Links
    M1 -->|Complete Engineering Re-write| M2
    M2 -->|Domain Scope Expansion| M3
    M3 -->|System Hardening Pipeline| M4

    %% Apply Styles
    class M1 phase1;
    class M2 phase2;
    class M3 phase3;
    class M4 phase4;
```
</details>
<details>
  
<summary><b>6.  Functional Access Control Matrix (RBAC) (Click to expand)</b></summary>

| Menu Item | Student | Staff (Requester) | Teacher (Reviewer) | Faculty Dean | Architectural Responsibility & Business Rules |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | General landing workspace for tracking personal claim timelines and operational metrics. |
| **My Expenses** | ✅ | ✅ | ✅ | ✅ | Personal reimbursement management. Students are capped at 2,000 TWD, while Staff/Teachers are capped at 10,000 TWD per claim. |
| **Approval Center** | ❌ | ❌ | ✅ | ✅ | **Teachers:** Review initial student submissions (`PENDING_TEACHER_REVIEW`).<br>**Deans:** Review faculty-wide logs (`PENDING_DEAN_APPROVAL`). |
| **Budget Manager** | ❌ | ❌ | ❌ | ✅ | Departmental annual fiscal allocation tracking. Excluded from Teachers and Staff to prevent ledger manipulation. |
| **Financial Reports** | ❌ | ❌ | ❌ | ✅ | Strategic expense analytics and data visualization across the faculty domain for institutional audits. |
| **User Directory** | ❌ | ❌ | ❌ | ❌ | Identity management view. Strictly isolated to the System Administrator. |


</details>
