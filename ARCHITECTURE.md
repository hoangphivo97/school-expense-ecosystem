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
%% Define Pure Business Logic Styles
classDef action fill:#ffffff,stroke:#37474f,stroke-width:1.5px;
classDef state fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,stroke-dasharray: 4 4;
classDef condition fill:#eceff1,stroke:#455a64,stroke-width:1.5px;
classDef success fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
classDef log fill:#e0f7fa,stroke:#00838f,stroke-width:1.5px;

%% Pre-define Centralized State Node to avoid parser conflicts
ST_Rejected((State:<br/>REJECTED))

subgraph Expense_Module ["📑 EXPENSE MODULE (Document & Approval Lifecycle)"]
    Start([🚀 Start: User Submits Request]) --> Act_Input
    Act_Input["Input Details & Uniform Invoice No. GUI"] --> Decision_Format
    Decision_Format{"Validation:<br/>Valid GUI Format?"}
    
    Decision_Format -->|"No"| Act_FixForm
    Act_FixForm["Prompt Error to Correct"] --> Act_Input
    
    Decision_Format -->|"Yes"| Log_Create
    Log_Create["Create AuditLogEntry<br/>action: SUBMIT"] --> Decision_Role
    
    Decision_Role{"Evaluate Submitter Role<br/>via JWT Custom Claims"}
    
    %% Branch 1: Student takes the full path
    ST_PendingTeacher(("State:<br/>PENDING_TEACHER_REVIEW"))
    Decision_Role -->|"Role: STUDENT"| ST_PendingTeacher
    
    ST_PendingTeacher --> Decision_Teacher
    Decision_Teacher{"Staff Review:<br/>Filter by departmentId"}
    
    Decision_Teacher -->|"Reject"| Log_StaffReject
    Log_StaffReject["Create AuditLogEntry<br/>action: REJECT & capture rejectReason"] --> Act_SetStaffReject
    Act_SetStaffReject["System: Set ExpenseStatus to REJECTED"] --> ST_Rejected
    
    %% Branch 2: Teacher / Staff bypasses Teacher Review
    ST_PendingDean(("State:<br/>PENDING_DEAN_APPROVAL"))
    Decision_Role -->|"Role: TEACHER / STAFF"| ST_PendingDean
    Decision_Teacher -->|"Approve"| Log_StaffApprove
    Log_StaffApprove["Create AuditLogEntry<br/>action: APPROVE"] -->|"Push to history"| ST_PendingDean
    
    ST_PendingDean --> Decision_Dean
    Decision_Dean{"Dean Review:<br/>Check Faculty Budget Cap in TWD"}
    
    Decision_Dean -->|"Reject"| Log_DeanReject
    Log_DeanReject["Create AuditLogEntry<br/>action: REJECT & capture rejectReason"] --> Act_SetDeanReject
    Act_SetDeanReject["System: Set ExpenseStatus to REJECTED"] --> ST_Rejected
    
    %% Branch 3: Dean bypasses manual reviews but system forces immediate budget freeze
    ST_PendingFinanceApproval(("State:<br/>PENDING_FINANCE_APPROVAL"))
    Decision_Role -->|"Role: DEAN"| Act_Freeze
    Decision_Dean -->|"Approve"| Act_Freeze
    
    Act_Freeze["DB Transaction:<br/>Freeze Requested TWD Amount"] --> Log_DeanApprove
    Log_DeanApprove["Create AuditLogEntry<br/>action: APPROVE & Budget Frozen"] -->|"Push to history"| ST_PendingFinanceApproval
    
    %% Unified Finance Audit Stage
    ST_PendingFinanceApproval --> Decision_Finance
    Decision_Finance{"Finance Audit:<br/>Verify School Tax ID 04126516?"}
    
    Decision_Finance -->|"Invalid"| Log_FinReject
    Log_FinReject["Create AuditLogEntry<br/>action: REJECT & capture rejectReason"] --> Act_SetFinReject
    Act_SetFinReject["System: Set ExpenseStatus to REJECTED"] --> Act_FinUnfreeze
    Act_FinUnfreeze["DB Transaction: Unfreeze TWD Balance"] --> ST_Rejected
    
    Decision_Finance -->|"Valid"| Log_FinApprove
    Log_FinApprove["Create AuditLogEntry<br/>action: APPROVE ➔ Ready for Payout"] --> Act_ReadyForPayout
    Act_ReadyForPayout["Lock Document Data & Queue for Payout"]
end

subgraph Payout_Module ["🏦 PAYOUT MODULE (Manual Reconciliation & Execution)"]
    ST_PendingDisbursement(("State:<br/>PENDING_DISBURSEMENT"))
    Act_ReadyForPayout -->|"System Sync: Set Status to PENDING_DISBURSEMENT"| ST_PendingDisbursement
    
    ST_PendingDisbursement --> Decision_PayoutMethod
    Decision_PayoutMethod{"Finance Officer Action:<br/>Select Strategy PaidMethod"}
    
    %% ==========================================
    %% AUTOMATED CASH PROCESSING WITH CRON JOB
    %% ==========================================
    Decision_PayoutMethod -->|"PaidMethod.CASH"| Act_CheckSlot
    Act_CheckSlot["Student opens UI Modal:<br/>Fetches available dates from payout-slots"] --> Decision_Quota
    
    Decision_Quota{"Is Selected Date<br/>Quota < 100?"}
    Decision_Quota -->|"No: Slot Full"| Act_CheckSlot
    
    Decision_Quota -->|"Yes: Slot Available"| Act_BookSlot
    Act_BookSlot["DB Transaction:<br/>Increment currentCount & Bind date to Expense"] --> Act_WaitDay
    
    Act_WaitDay["Wait for Scheduled Appointment Date"] --> Decision_Attendance
    Decision_Attendance{"Lifecycle Event Audit:<br/>Trigger Condition Type?"}
    
    %% AUTOMATED RESET LOOP VIA MIDNIGHT CRON JOB
    Decision_Attendance -->|"Midnight Cron: Past & Unpaid"| Act_CronReset
    Act_CronReset["Automated Midnight Cron Job:<br/>Reset appointmentStatus to MISSED & Unlock User"] --> Act_CheckSlot
    
    %% Process if student arrived within the day
    Decision_Attendance -->|"Manual: Student Present Within Slot"| Act_VerifyPaper
    Act_VerifyPaper["Verify Original Physical GUI Invoice"] --> Act_StampPaper
    Act_StampPaper["Stamp '已核銷 - PAID' on Physical Bill"] --> Act_UploadCashProof
    
    Act_UploadCashProof["Upload Photo of Stamped Invoice to proofUrls"] --> Act_ManualCashPaid
    Act_ManualCashPaid["Click 'Confirm Cash Paid' on Payout Page"] --> Log_CashPaid
    Log_CashPaid["Create AuditLogEntry<br/>action: DISBURSE"] --> Act_SyncDisbursed
    
    %% ==========================================
    %% BRANCH: BANK TRANSFER PROCESSING (WITH FAILURE PROOF UPLOADS)
    %% ==========================================
    Decision_PayoutMethod -->|"PaidMethod.BANK_TRANSFER"| Act_CreateBatch
    Act_CreateBatch["Select Multiple Requests ➔ Create Batch Record"] --> Act_ExportBank
    Act_ExportBank["Export Batch File & Manually Upload to Bank Portal"] --> Log_BatchExport
    Log_BatchExport["Log: Batch Exported with linked expenseIds"] --> Act_ReviewOffline
    Act_ReviewOffline["Finance Officer: Reviews Offline Bank Report"] --> Decision_ManualRecon
    
    Decision_ManualRecon{"Manual Reconciliation View:<br/>Finance Officer Updates Status"}
    
    %% Scenario 1: All Successful
    Decision_ManualRecon -->|"All Successful"| Act_UploadMasterReceipt
    Act_UploadMasterReceipt["Upload Master Bank Receipt PDF to Batch proofUrls"] --> Act_MarkBatchPaid
    Act_MarkBatchPaid["Click 'Mark Batch as Paid'"] --> Log_BatchSuccess
    Log_BatchSuccess["Create AuditLogEntry for All Items<br/>action: DISBURSE & Inherit Receipt"] --> Act_SyncDisbursed
    
    %% Scenario 2: Total Failure
    Decision_ManualRecon -->|"Total Failure"| Act_UploadTotalFailProof
    Act_UploadTotalFailProof["Upload Bank Failure Report/Error Statement to Batch proofUrls"] --> Act_RejectBatch
    Act_RejectBatch["Click 'Reject Batch'"] --> Log_BatchFail
    Log_BatchFail["Log: Batch Canceled & Capture rejectReason"] --> Act_SyncAllRejected
    Act_SyncAllRejected["System Sync: Set ExpenseStatus to REJECTED<br/>➔ Append final AuditLogEntry with rejectReason to history"] --> Act_BatchUnfreeze
    Act_BatchUnfreeze["DB Transaction: Unfreeze TWD Balance for All Items"] --> ST_Rejected
    
    %% Scenario 3: Partial Failure
    Decision_ManualRecon -->|"Partial Failure"| Act_UploadPartialFailProof
    Act_UploadPartialFailProof["Upload Bank Statement detailing failed line-items to Batch proofUrls"] --> Act_LineAudit
    Act_LineAudit["Isolate Failed Requests on Payout View"] --> Act_MarkFailedItems
    
    Act_MarkFailedItems["Click 'Mark Selected as Failed'"] --> Log_LineFail
    Log_LineFail["Create AuditLogEntry for Lines<br/>action: REJECT & capture rejectReason"] --> Act_SyncLineRejected
    Act_SyncLineRejected["System Sync: Set Failed Line-Items Status to REJECTED<br/>➔ Append final AuditLogEntry with rejectReason to history"] --> Act_LineUnfreeze
    Act_LineUnfreeze["DB Transaction: Unfreeze TWD Balance for Failed Lines"] --> ST_Rejected
    
    %% Partial Failure Branch - Success Items Line Logic
    Act_LineAudit --> Act_UploadPartialReceipt
    Act_UploadPartialReceipt["Upload Master Bank Receipt PDF for Successful Part"] --> Act_MarkSuccessItems
    Act_MarkSuccessItems["Click 'Mark Remaining as Paid'"] --> Log_LineSuccess
    Log_LineSuccess["Create AuditLogEntry for Lines<br/>action: DISBURSE & Inherit Receipt"] --> Act_SyncDisbursed
end

%% Cross-Module State Sync Hooks
ST_Disbursed(("State:<br/>DISBURSED"))
End_Success([🏁 End: Expense Closed])
Act_SyncDisbursed["System Sync: Set ExpenseStatus to DISBURSED<br/>➔ Append final AuditLogEntry to history"] --> ST_Disbursed --> End_Success

%% Linear mapping to prevent Mermaid Array Length limits
Act_SetStaffReject --> ST_Rejected
Act_SetDeanReject --> ST_Rejected
Act_FinUnfreeze --> ST_Rejected
Act_BatchUnfreeze --> ST_Rejected
Act_LineUnfreeze --> ST_Rejected

Act_Clone["UX Rule: Student Clones Request to Fix Details<br/>➔ Copy Text Metadata & Purge old proofUrls"]
ST_Rejected --> Act_Clone --> Start

%% Apply Styling Classes
class Act_Input,Act_FixForm,Act_Freeze,Act_SetStaffReject,Act_SetDeanReject,Act_SetFinReject,Act_FinUnfreeze,Act_ReadyForPayout,Act_CheckSlot,Act_BookSlot,Act_WaitDay,Act_CronReset,Act_VerifyPaper,Act_StampPaper,Act_UploadCashProof,Act_ManualCashPaid,Act_CreateBatch,Act_ExportBank,Act_ReviewOffline,Act_UploadMasterReceipt,Act_MarkBatchPaid,Act_UploadTotalFailProof,Act_RejectBatch,Act_SyncAllRejected,Act_BatchUnfreeze,Act_UploadPartialFailProof,Act_LineAudit,Act_MarkFailedItems,Act_SyncLineRejected,Act_LineUnfreeze,Act_UploadPartialReceipt,Act_MarkSuccessItems,Act_SyncDisbursed,Act_Clone action;
class ST_PendingTeacher,ST_PendingDean,ST_PendingFinanceApproval,ST_PendingDisbursement,ST_Rejected,ST_Disbursed state;
class Decision_Format,Decision_Role,Decision_Teacher,Decision_Dean,Decision_Finance,Decision_PayoutMethod,Decision_Quota,Decision_Attendance,Decision_ManualRecon condition;
class End_Success success;
class Log_Create,Log_StaffReject,Log_StaffApprove,Log_DeanReject,Log_DeanApprove,Log_FinReject,Log_FinApprove,Log_CashPaid,Log_BatchExport,Log_BatchSuccess,Log_BatchFail,Log_LineFail,Log_LineSuccess log;
```

</details>

<details>
<summary><b>3. High-level Architectural Block Diagram (Click to expand)</b></summary>
  
```mermaid
graph TB
    %% Define DDD Architecture Styles
    classDef domain fill:#f1f8e9,stroke:#558b2f,stroke-width:2px;
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:1.5px;
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1.5px;
    classDef shared fill:#fffide,stroke:#fbc02d,stroke-width:1.5px;
    classDef infra fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
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
                BE_Exp_Repo["data-access-backend<br/>(Repository Interface Abstraction)"]
            end
            
            subgraph Payout_BE ["📦 PAYOUT BACKEND DOMAIN (Planned - Phase 2)"]
                BE_Pay_Ctrl["features-backend<br/>(Payout Batch Controller)"]
                BE_Pay_Service["data-access-backend<br/>(Bulk Transfer & PDF Parsing Logic)"]
            end
            
            subgraph Auth_BE ["📦 AUTH BACKEND DOMAIN"]
                BE_Auth_Ctrl["features-backend<br/>(Auth Controller & JWT Guards)"]
                BE_Auth_Service["data-access-backend<br/>(Session & Claims Services)"]
            end
            
            subgraph Finance_BE ["📦 FINANCE BACKEND DOMAIN"]
                BE_Fin_Ctrl["features-backend<br/>(Budget Controller Layer)"]
                BE_Fin_Service["data-access-backend<br/>(TWD Budget Allocation Logic)"]
            end
        end

        %% --- SHARED KERNEL ---
        subgraph Shared_Kernel ["💛 SHARED KERNEL (libs/shared/*)"]
            Shared_UI["ui & ui-react<br/>(Design System / DarkModeToggle)"]
            Shared_Tokens["tokens<br/>(Injection Tokens & Configuration)"]
            Shared_Types["types<br/>(Global Enums & Shared Interfaces)"]
        end
    end

    %% --- INFRASTRUCTURE ADAPTERS LAYER ---
    subgraph Infrastructure ["🗄️ INFRASTRUCTURE & INTEGRATION LAYER"]
        FB_Auth["Firebase Authentication<br/>(Identity Service Gateway)"]
        Firestore[("Firebase Firestore Adapter<br/>(NoSQL Bounded Collections)")]
        Storage[("Firebase Cloud Storage Adapter<br/>(GUI Receipts & Master PDFs)")]
        BankBOT[["Bank of Taiwan App<br/>(Offline File-Based Clearing)"]]
    end

    %% Core Internal Backend Connections
    BE_Exp_Ctrl --> BE_Exp_Service
    BE_Exp_Service --> BE_Exp_Repo
    BE_Auth_Ctrl --> BE_Auth_Service
    BE_Fin_Ctrl --> BE_Fin_Service
    BE_Pay_Ctrl --> BE_Pay_Service

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
    
    %% Infrastructure Adapters Implementations
    BE_Exp_Repo -->|"Firebase Admin SDK Server Operations"| Firestore
    BE_Exp_Service -->|"Cloud Storage Service"| Storage
    BE_Pay_Service -.->|"Uploads Master Receipt PDF"| Storage
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
    class BE_Exp_Ctrl,BE_Exp_Service,BE_Exp_Repo,BE_Auth_Ctrl,BE_Auth_Service,BE_Fin_Ctrl,BE_Fin_Service backend;
    class FE_Pay_Feature,FE_Pay_DA,BE_Pay_Ctrl,BE_Pay_Service planned;
    class Shared_UI,Shared_Tokens,Shared_Types shared;
    class FB_Auth,Firestore,Storage,BankBOT infra;
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
        string expenseCode UK "[FACULTY]-[MMYY]-[CRYPTO]"
        string userId FK "Links to USERS.id"
        string requesterCode "userCode at submission"
        string requesterName "fullName at submission"
        string facultyId "FacultyId Enum"
        number amount "Reimbursement Value (TWD)"
        string purpose "Statement of Purpose"
        string description "Detailed Field Notes"
        string status "ExpenseStatus Enum"
        string paidMethod "PaidMethod Enum"
        string date "Target Appointment / Expense Date"
        string appointmentStatus "AppointmentStatus Enum"
        array_string proofUrls "Cloud Storage References"
        array_object history "Embedded Array of AuditLogEntry objects"
        string requesterType "UserType Enum"
        string rejectReason "Optional"
        string createdAt "ISO String Timestamp"
        string updatedAt "ISO String Timestamp"
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
        string description "Semantic detail (e.g., Activated Student Account)"
        string createdAt "ISO String Timestamp"
    }

    USERS ||--o{ EXPENSES : "submits"
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
