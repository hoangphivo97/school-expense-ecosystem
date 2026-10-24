# FIRESTORE DATA ACCESS & TRANSACTIONAL SAFETY RULES

Enforce strict encapsulation, cost guardrails, and transactional consistency for all Firestore persistence logic.

---

## 1. Repository Pattern & Abstract Contracts

- **Scope Restriction**: All Firestore persistence operations MUST reside strictly within `libs/**/data-access-backend/src/lib/repositories/`.
- **Abstract Class Requirement**:
  - Every entity repository must define an abstract contract inside `repositories/abstracts/<entity>.repository.ts` (e.g., `abstract class ProjectRepository`).
  - Method signatures must operate on typed domain models (e.g., `ProjectItem`, `PaginatedProjectResult`) and never leak Firestore types.
- **Infrastructure Implementation**:
- Concrete repositories must be located in `repositories/infrastructure/firebase-<entity>.repository.ts` (or `firestore-<entity>.repository.ts`).
  - **Base Class Hierarchy & Domain Scoping**:
    1. **Global Shared Base (`@school-expense-ecosystem/shared/data-access-backend`)**:
       - `BaseFirestoreRepository<T extends BaseEntity>`: The ONLY base repository allowed to be extended across different domains (`finance`, `admin`, `expenses`, etc.).
    2. **Domain-Specific Base (`libs/projects/data-access-backend`)**:
       - `FirebaseBaseRepository<T extends JoinableEntity>`: Belongs EXCLUSIVELY to the `projects` domain. It is strictly limited to entities requiring join codes and student rosters (`ProjectItem`, `EventItem`).
       - **Strict Prohibition**: Repositories outside `scope:projects` (e.g., `FirestoreDepartmentFundRepository`, `FirestoreFacultyRepository`, `FirestoreExpenseRepository`) must NEVER extend `FirebaseBaseRepository`. Non-joinable entities must either extend `BaseFirestoreRepository<T>` or directly implement their abstract contract.
- **No SDK Leaks**:
  - Injecting `'FIRESTORE_INSTANCE'` or importing `firebase-admin/firestore` outside `repositories/infrastructure/` is an automatic REJECT.
  - Services, controllers, and UI components must NEVER handle raw `DocumentSnapshot`, `QuerySnapshot`, or `DocumentReference`.

---

## 2. Financial Safety & Transaction Isolation

- **Mandatory Transactions**: Any operation involving financial balances, budget caps, fund deductions, or ledger updates (e.g., `createWithFacultyFund`) MUST execute within `this.db.runTransaction()`.
- **Atomic Deltas**: Numeric updates to balances and expenditure counters must utilize `admin.firestore.FieldValue.increment()` within transaction boundaries.
- **Optimistic Locking**: State machine transitions and concurrent edits must verify `updatedAt` timestamps or document preconditions to prevent race conditions.

---

## 3. Query Protection & Cost Control (Unbounded Reads)

- **Mandatory Safe Limit**: All list and search queries must enforce a hard upper bound via `.limit(safeLimit)` (e.g., `Math.min(100, limit)`) to prevent quota exhaustion.
- **Cursor Pagination**: Large dataset queries must implement token-based or cursor-based pagination using `.startAfter(startDoc)`.
- **Materialized Queries**: Avoid client-side filtering on large result sets; leverage materialized array fields (e.g., `years: array-contains`) and prefix search indexes.

## 4. OUTPUT CONTRACT

If any database leak, un-bound query limit, or missing transaction boundary is detected, start immediately with:
`VERDICT: CHANGES_REQUESTED`

If all Firestore persistence rules are satisfied, start immediately with:
`VERDICT: APPROVED`