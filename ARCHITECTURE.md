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
    classDef data_abstraction fill:#e0f2f1,stroke:#004d40,stroke-width:2.5px;
    classDef planned fill:#f5f5f5,stroke:#9e9e9e,stroke-width:1.5px,stroke-dasharray: 5 5;
    classDef highlight fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;

    subgraph Workspace_Monorepo ["📦 NX MONOREPO WORKSPACE (Enterprise Domain-Driven Design)"]

        %% ========================================================
        %% FRONTEND CONTEXTS LAYER
        %% ========================================================
        subgraph FE_Layer ["🖥️ FRONTEND LAYER (Domain-Driven Micro-Frontends)"]
            App_Shell["mfe-shell-angular<br/>(Angular Host Application)"]
            App_Remote["mfe-remote-react<br/>(React Remote Application)"]

            %% Context: Projects & Events
            subgraph Projects_FE ["📦 PROJECTS & EVENTS CONTEXT (libs/projects/*)"]
                FE_Proj_Feature["features<br/>• CreateProjectDialog<br/>• CreateEventDialog<br/>• JoinCodeDialog / Manage"]
                FE_Proj_DA["data-access<br/>(ProjectApiService & EventApiService)"]
                FE_Proj_UI["ui & utils<br/>(ActivityCapacityProgress & Layouts)"]
            end

            %% Context: Expenses
            subgraph Expense_FE ["📦 EXPENSES CONTEXT (libs/expenses/*)"]
                FE_Exp_Feature["features<br/>• CreateExpenseModal (Item List & Est TWD)<br/>• InvoiceSettlementModal (e-GUI Scan)<br/>• ExpenseReviewModal (Teacher/Dean/Fin)"]
                FE_Exp_DA["data-access<br/>(ExpenseService & ExpenseSignalStore)"]
            end

            %% Context: Finance
            subgraph Finance_FE ["📦 FINANCE CONTEXT (libs/finance/*)"]
                FE_Fin_Feature["features<br/>(BudgetManager / Ledger Overview)"]
                FE_Fin_DA["data-access<br/>(BudgetApiService)"]
            end

            %% Context: Auth
            subgraph Auth_FE ["📦 AUTH CONTEXT (libs/auth/*)"]
                FE_Auth_Feature["features<br/>(Login, RegisterModal, Onboarding)"]
                FE_Auth_DA["data-access<br/>(AuthSignalStore & ActiveUserGuard)"]
            end

            %% Context: Payout (Phase 2)
            subgraph Payout_FE ["📦 PAYOUT CONTEXT (Planned - Phase 2)"]
                FE_Pay_Feature["features<br/>(Batch Wire & Counter Cash Dashboard)"]
                FE_Pay_DA["data-access<br/>(ReconciliationService)"]
            end
        end

        %% ========================================================
        %% BACKEND CONTEXTS LAYER
        %% ========================================================
        subgraph BE_Layer ["⚙️ APPLICATION LOGIC LAYER (NestJS Core - apps/backend)"]

            %% Backend: Projects & Events
            subgraph Projects_BE ["📦 PROJECTS & EVENTS DOMAIN (libs/projects/*)"]
                BE_Proj_Ctrl["features-backend<br/>(ProjectController & EventController)"]
                BE_Proj_Service["data-access-backend<br/>(ProjectService, EventService & SharedService)"]
                BE_Proj_Guard["guards-backend<br/>(ActivityMembershipGuard & CapGuard)"]
                BE_Proj_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>ProjectRepo & EventRepo Contracts]"]
            end

            %% Backend: Expenses
            subgraph Expense_BE ["📦 EXPENSES DOMAIN (libs/expenses/*)"]
                BE_Exp_Ctrl["features-backend<br/>(ExpenseController)"]
                BE_Exp_Service["data-access-backend<br/>(Two-Phase Reservation & Variance Logic)"]
                BE_Exp_Guard["guards-backend<br/>(ExpenseReviewGuard & CapGuard)"]
                BE_Exp_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>ExpenseRepository Contract]"]
            end

            %% Backend: Finance
            subgraph Finance_BE ["📦 FINANCE DOMAIN (libs/finance/*)"]
                BE_Fin_Ctrl["features-backend<br/>(BudgetController & FacultyController)"]
                BE_Fin_Service["data-access-backend<br/>(School Treasury & Ledger Service)"]
                BE_Fin_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>Faculty & BudgetRepo Contract]"]
            end

            %% Backend: Auth
            subgraph Auth_BE ["📦 AUTH DOMAIN (libs/auth/*)"]
                BE_Auth_Ctrl["features-backend<br/>(AuthController & RolesGuard)"]
                BE_Auth_Service["data-access-backend<br/>(Session & Token Claims Service)"]
                BE_Auth_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>Identity & UserRepo Contract]"]
            end

            %% Backend: Payout (Phase 2)
            subgraph Payout_BE ["📦 PAYOUT DOMAIN (Planned - Phase 2)"]
                BE_Pay_Ctrl["features-backend<br/>(PayoutBatchController)"]
                BE_Pay_Service["data-access-backend<br/>(AtomicSlotBooking & BankRecon)"]
                BE_Pay_Repo["data-access-backend<br/>[DATA ABSTRACTION LAYER:<br/>PayoutStorage Contract]"]
            end
        end

        %% ========================================================
        %% SHARED KERNEL
        %% ========================================================
        subgraph Shared_Kernel ["💛 SHARED KERNEL (libs/shared/*)"]
            Shared_Types["types<br/>(ProjectStatus, EventStatus, FundingType,<br/>UserType, Role, ExpenseStatus)"]
            Shared_Tokens["tokens<br/>(InjectionTokens & AppConfigs)"]
            Shared_UI["ui & ui-react<br/>(Shared Modal, Breadcrumb, DarkMode)"]
            Shared_Guards["guards-backend<br/>(JwtAuthGuard, RolesDecorator, AppCheckGuard)"]
        end
    end

    %% ========================================================
    %% INFRASTRUCTURE ADAPTERS LAYER
    %% ========================================================
    subgraph Infrastructure ["🗄️ INFRASTRUCTURE ADAPTERS LAYER (Storage & External Systems)"]
        FB_Auth["Firebase Authentication<br/>(Identity Service Gateway)"]
        Firestore[("Cloud Firestore<br/>• projects & events<br/>• expenses (items, est, actual)<br/>• budgets & invoices_registry")]
        Storage[("Cloud Storage Bucket<br/>(e-GUI Invoices & Stamped Cash Proofs)")]
        BankBOT[["Bank of Taiwan Portal<br/>(Offline File-Based Clearing)"]]
    end

    %% ========================================================
    %% COMPONENT LINKAGES & DATA FLOWS
    %% ========================================================

    %% Frontend Integrations
    App_Shell --> FE_Proj_Feature
    App_Shell --> FE_Exp_Feature
    App_Shell --> FE_Fin_Feature
    App_Shell --> FE_Auth_Feature
    App_Shell -.-> FE_Pay_Feature
    App_Remote -->|"Exposes Header/Theme Layout"| App_Shell

    FE_Proj_Feature --> FE_Proj_DA
    FE_Proj_Feature --> FE_Proj_UI
    FE_Exp_Feature --> FE_Exp_DA
    FE_Exp_Feature -.->|"Query User Active Memberships"| FE_Proj_DA
    FE_Fin_Feature --> FE_Fin_DA
    FE_Auth_Feature --> FE_Auth_DA
    FE_Pay_Feature --> FE_Pay_DA

    %% Frontend to Backend (REST APIs)
    FE_Proj_DA -->|"HTTPS / REST (JWT + AppCheck)"| BE_Proj_Ctrl
    FE_Exp_DA -->|"HTTPS / REST (JWT + AppCheck)"| BE_Exp_Ctrl
    FE_Fin_DA -->|"HTTPS / REST (JWT + AppCheck)"| BE_Fin_Ctrl
    FE_Auth_DA -->|"HTTPS / REST (JWT + AppCheck)"| BE_Auth_Ctrl
    FE_Pay_DA -.->|"HTTPS / REST (Future)"| BE_Pay_Ctrl

    %% Backend Controller to Service
    BE_Proj_Ctrl --> BE_Proj_Guard --> BE_Proj_Service
    BE_Exp_Ctrl --> BE_Exp_Guard --> BE_Exp_Service
    BE_Fin_Ctrl --> BE_Fin_Service
    BE_Auth_Ctrl --> BE_Auth_Service
    BE_Pay_Ctrl --> BE_Pay_Service

    %% Cross-Domain Domain Service Orchestration (Business Logic)
    BE_Proj_Service -->|"SCHOOL Funding: Request Budget Alloc"| BE_Fin_Service
    BE_Exp_Service -->|"Phase 1: Hold Estimated Cap"| BE_Proj_Service
    BE_Exp_Service -->|"Phase 2: Settle & Unfreeze Delta"| BE_Proj_Service
    BE_Exp_Service -.->|"Queue Ready for Payout"| BE_Pay_Service

    %% Service to Repository Contract (Data Abstraction)
    BE_Proj_Service --> BE_Proj_Repo
    BE_Exp_Service --> BE_Exp_Repo
    BE_Fin_Service --> BE_Fin_Repo
    BE_Auth_Service --> BE_Auth_Repo
    BE_Pay_Service --> BE_Pay_Repo

    %% Repository Contracts to Infrastructure
    BE_Proj_Repo --> Firestore
    BE_Exp_Repo --> Firestore
    BE_Exp_Repo --> Storage
    BE_Fin_Repo --> Firestore
    BE_Auth_Repo --> FB_Auth
    BE_Auth_Repo --> Firestore
    BE_Pay_Repo --> Firestore
    BE_Pay_Repo --> Storage

    %% Shared Types Distribution
    Shared_Types -.-> BE_Proj_Ctrl
    Shared_Types -.-> BE_Exp_Ctrl
    Shared_Types -.-> FE_Proj_DA
    Shared_Types -.-> FE_Exp_DA

    %% External Systems
    BE_Fin_Ctrl -.->|"Generate Batch Export"| BankBOT
    BE_Pay_Service -.->|"Reconcile Transfer Statement"| BankBOT

    %% Class Assignments
    class App_Shell,App_Remote,FE_Proj_Feature,FE_Proj_DA,FE_Proj_UI,FE_Exp_Feature,FE_Exp_DA,FE_Fin_Feature,FE_Fin_DA,FE_Auth_Feature,FE_Auth_DA client;
    class BE_Proj_Ctrl,BE_Proj_Service,BE_Proj_Guard,BE_Exp_Ctrl,BE_Exp_Service,BE_Exp_Guard,BE_Fin_Ctrl,BE_Fin_Service,BE_Auth_Ctrl,BE_Auth_Service backend;
    class Shared_Types,Shared_Tokens,Shared_UI,Shared_Guards shared;
    class FB_Auth,Firestore,Storage,BankBOT infra;
    class BE_Proj_Repo,BE_Exp_Repo,BE_Fin_Repo,BE_Auth_Repo data_abstraction;
    class FE_Pay_Feature,FE_Pay_DA,BE_Pay_Ctrl,BE_Pay_Service,BE_Pay_Repo planned;
    class Projects_FE,Projects_BE highlight;
```

</details>
<details>
<summary><b>4. Firestore NoSQL Data Model Diagram (Click to expand)</b></summary>
  
```mermaid
erDiagram
    %% ========================================================
    %% IDENTITY & MEMBERSHIP MANAGEMENT
    %% ========================================================
    USERS {
        string id PK "uid (Firebase Auth)"
        string userCode UK "Unique Academic/Staff ID"
        string fullName "Legal Name"
        string email "Institutional Email"
        string role "Role: ADMIN | FINANCE_OFFICER | FACULTY_DEAN | END_USER"
        string userType "UserType: STUDENT | TEACHER | STAFF"
        string facultyId "FacultyId: FIT | FBE | FLL | FET | FAD | FLA"
        string status "UserStatus: PENDING | ACTIVE | REJECTED | SUSPENDED"
        string createdAt "ISO String"
    }

    ACTIVITY_MEMBERS {
        string id PK "Auto-generated UUID"
        string activityType "Type: PROJECT | EVENT"
        string activityId FK "Links to PROJECTS.id or EVENTS.id"
        string userId FK "Links to USERS.id"
        string roleInActivity "ActivityRole: LEADER | ADVISOR_TEACHER | MEMBER"
        string joinCodeId FK "Nullable: Links to JOIN_CODES.id"
        string joinedAt "ISO String"
    }

    JOIN_CODES {
        string id PK "Auto-generated UUID"
        string code UK "Alphanumeric Code"
        string activityType "Type: PROJECT | EVENT"
        string activityId FK "Links to PROJECTS.id or EVENTS.id"
        string createdById FK "Links to USERS.id"
        number maxQuota "Capacity Limit"
        number currentCount "Current Registrations"
        string status "JoinCodeStatus: SCHEDULED | ACTIVE | FULL | EXPIRED"
        string validFrom "ISO String"
        string validUntil "ISO String"
    }

    %% ========================================================
    %% PROJECT & EVENT ENTITIES
    %% ========================================================
    PROJECTS {
        string id PK "Auto-generated UUID"
        string projectCode UK "PRJ-[FACULTY]-[YY]-[CRYPTO]"
        string title "Project Display Name"
        string ownerId FK "Creator (USERS.id)"
        string facultyId "FacultyId Enum"
        string fundingType "ProjectFundingType: SCHOOL | FACULTY | OUTSOURCE"
        string status "ProjectStatus: DRAFT | PENDING_DEAN_APPROVAL | PENDING_FINANCE_APPROVAL | ACTIVE | COMPLETED | REJECTED"
        number totalBudget "TWD Total Allocated Budget"
        number holdBalance "TWD Reserved For In-Flight Procurements"
        number spentBalance "TWD Realized / Settled Expenditures"
        number availableBalance "totalBudget - holdBalance - spentBalance"
        string createdAt "ISO String"
        string updatedAt "ISO String"
    }

    EVENTS {
        string id PK "Auto-generated UUID"
        string eventCode UK "EVT-[FACULTY]-[YY]-[CRYPTO]"
        string title "Event Display Name"
        string organizerId FK "Creator (USERS.id)"
        string projectId FK "Nullable: Parent Project (if fundingType = PROJECT)"
        string facultyId "FacultyId Enum"
        string fundingType "EventFundingType: SCHOOL | FACULTY | OUTSOURCE | PROJECT"
        string status "EventStatus: PENDING_DEAN_APPROVAL | PENDING_FINANCE_APPROVAL | UPCOMING | ONGOING | COMPLETED | REJECTED"
        number totalBudget "TWD Event Budget Cap"
        number holdBalance "TWD Reserved For In-Flight Procurements"
        number spentBalance "TWD Realized Expenditures"
        number availableBalance "Spendable Balance"
        string createdAt "ISO String"
        string updatedAt "ISO String"
    }

    %% ========================================================
    %% 2-PHASE EXPENSE & PROCUREMENT MANAGEMENT
    %% ========================================================
    EXPENSES {
        string id PK "Auto-generated UUID"
        string expenseCode UK "EXP-[FACULTY]-[MMYY]-[CRYPTO]"
        string requesterId FK "Applicant (USERS.id - Must be Activity Member)"
        string activityType "Scope: PROJECT | EVENT"
        string activityId FK "Links to PROJECTS.id or EVENTS.id"
        string advisorTeacherId FK "Nullable: Supervising Teacher (USERS.id)"
        string status "ExpenseStatus: DRAFT | PENDING_TEACHER_REVIEW | PENDING_DEAN_APPROVAL | AUTHORIZED_FOR_PURCHASE | PENDING_FINANCE_APPROVAL | PENDING_DISBURSEMENT | DISBURSED | REVISION_REQUIRED | REJECTED"
        number totalEstimatedAmount "Sum of procurement items (Phase 1)"
        number totalActualAmount "Nullable: Sum of actual receipts (Phase 2)"
        number varianceAmount "totalActualAmount - totalEstimatedAmount"
        string purpose "Procurement Business Rationale"
        string paidMethod "PaidMethod: CASH | BANK_TRANSFER"
        string cashAppointmentDate "Scheduled Counter Appointment Date"
        string payoutBatchId FK "Nullable: Links to PAYOUT_BATCHES.id"
        array_string receiptProofUrls "Taiwan GUI Scan or Stamped Paper Proofs"
        string rejectReason "Optional audit decline notes"
        string createdAt "ISO String"
        string updatedAt "ISO String"
    }

    PROCUREMENT_ITEMS {
        string id PK "Auto-generated Item UUID"
        string expenseId FK "Links to EXPENSES.id"
        string itemName "Descriptive Item Name / Specs"
        number quantity "Planned Purchase Units"
        number estimatedUnitPrice "Estimated Unit Price (TWD)"
        number estimatedSubtotal "quantity * estimatedUnitPrice"
        string purposeNote "Why this item is necessary"
        number actualUnitPrice "Nullable: Actual Unit Price (TWD)"
        number actualSubtotal "Nullable: actualUnitPrice * quantity"
    }

    INVOICE_REGISTRY {
        string id PK "Auto-generated UUID"
        string invoiceNumber UK "e-GUI 10-char alphanumeric (e.g. AB-12345678)"
        string invoiceDate UK "GUI Issuance Date (Compound unique key)"
        string buyerTaxId "Must match School VAT: 04126516"
        number totalAmount "Decoded Amount from Hex (TWD)"
        string expenseId FK "Enforces 1:1 binding to EXPENSES.id"
        string uploadedById FK "Links to USERS.id"
        string rawQrLeft "Raw decoded 77-byte standard QR string"
        string rawQrRight "Raw decoded auxiliary QR string"
        string createdAt "ISO String"
    }

    EXPENSE_AUDIT_LOGS {
        string id PK "Auto-generated Log UUID"
        string expenseId FK "Links to EXPENSES.id"
        string actorId FK "Actor (USERS.id)"
        string actorRole "Actor Role at execution"
        string action "AuditAction: DRAFT_SUBMIT | TEACHER_REVIEW | DEAN_APPROVE | RECEIPT_UPLOAD | FINANCE_APPROVE | REJECT | DISBURSE"
        string previousStatus "ExpenseStatus Enum"
        string newStatus "ExpenseStatus Enum"
        string comments "Audit findings / variance explanations"
        string createdAt "ISO String"
    }

    %% ========================================================
    %% TREASURY & PAYOUT DISBURSEMENT
    %% ========================================================
    FACULTY_BUDGETS {
        string id PK "Document ID equals facultyId or SCHOOL_TREASURY"
        string facultyId "FacultyId: FIT | FBE | FLL | FET | FAD | FLA"
        number totalAllocation "School Allocated Annual Budget"
        number allocatedToProjects "Portion committed to Projects"
        number spentAmount "Actual Disbursed to date"
        number availableBalance "Unallocated Faculty Reserve"
        string fiscalYear "e.g. 2026-2027"
        string updatedAt "ISO String"
    }

    PAYOUT_BATCHES {
        string id PK "Auto-generated Batch UUID"
        string batchCode UK "BATCH-[YYMMDD]-[CRYPTO]"
        string payoutType "PaidMethod: BANK_TRANSFER | CASH_DESK"
        number totalDisbursedAmount "Cumulative sum of linked expenses"
        number itemCount "Total number of settled expense requests"
        string masterProofUrl "Bank Wire Reconciliation PDF"
        string status "BatchStatus: CREATED | EXPORTED | RECONCILED | REJECTED"
        string createdAt "ISO String"
        string updatedAt "ISO String"
    }

    %% ========================================================
    %% DOMAIN RELATIONSHIPS
    %% ========================================================
    USERS ||--o{ PROJECTS : "creates_or_owns"
    USERS ||--o{ EVENTS : "organizes"
    USERS ||--o{ ACTIVITY_MEMBERS : "participates_as"
    USERS ||--o{ EXPENSES : "submits_procurement"
    USERS ||--o{ EXPENSE_AUDIT_LOGS : "records_action"

    PROJECTS ||--o{ ACTIVITY_MEMBERS : "enrolls"
    EVENTS ||--o{ ACTIVITY_MEMBERS : "enrolls"
    PROJECTS ||--o{ JOIN_CODES : "generates_access_code"
    EVENTS ||--o{ JOIN_CODES : "generates_access_code"
    JOIN_CODES ||--o{ ACTIVITY_MEMBERS : "redeemed_by"

    PROJECTS ||--o{ EVENTS : "funds_child_event"
    FACULTY_BUDGETS ||--o{ PROJECTS : "allocates_budget_cap"

    PROJECTS ||--o{ EXPENSES : "funds_expense_request"
    EVENTS ||--o{ EXPENSES : "funds_expense_request"
    EXPENSES ||--|{ PROCUREMENT_ITEMS : "contains_line_items"
    EXPENSES ||--o| INVOICE_REGISTRY : "verified_by_e_invoice"
    EXPENSES ||--o{ EXPENSE_AUDIT_LOGS : "tracks_audit_trail"
    
    PAYOUT_BATCHES ||--o{ EXPENSES : "settles_and_disburses"
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
