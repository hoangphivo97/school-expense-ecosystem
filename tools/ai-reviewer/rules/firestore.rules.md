# FIRESTORE DATA ACCESS & TRANSACTIONAL SAFETY RULES

Enforce strict encapsulation, cost guardrails, and transactional consistency for all Firestore persistence logic.

---

## 1. Repository Pattern & Abstract Contracts
- **Scope Restriction**: All Firestore persistence operations MUST reside strictly within `libs/**/data-access-backend/src/lib/repositories/`[cite: 5, 6].
- **Abstract Class Requirement**:
  - Every entity repository must define an abstract contract inside `repositories/abstracts/<entity>.repository.ts` (e.g., `abstract class ProjectRepository`)[cite: 5, 7].
  - Method signatures must operate on typed domain models (e.g., `ProjectItem`, `PaginatedProjectResult`) and never leak Firestore types[cite: 7].
- **Infrastructure Implementation**:
  - Concrete repositories must be located in `repositories/infrastructure/firebase-<entity>.repository.ts` (or `firestore-<entity>.repository.ts`)[cite: 5, 6].
  - Concrete repositories must extend `FirebaseBaseRepository<T>` and implement the corresponding abstract repository class[cite: 6].
- **No SDK Leaks**:
  - Injecting `'FIRESTORE_INSTANCE'` or importing `firebase-admin/firestore` outside `repositories/infrastructure/` is an automatic REJECT[cite: 6].
  - Services, controllers, and UI components must NEVER handle raw `DocumentSnapshot`, `QuerySnapshot`, or `DocumentReference`[cite: 6, 8].

---

## 2. Financial Safety & Transaction Isolation
- **Mandatory Transactions**: Any operation involving financial balances, budget caps, fund deductions, or ledger updates (e.g., `createWithFacultyFund`) MUST execute within `this.db.runTransaction()`[cite: 6].
- **Atomic Deltas**: Numeric updates to balances and expenditure counters must utilize `admin.firestore.FieldValue.increment()` within transaction boundaries[cite: 6, 7].
- **Optimistic Locking**: State machine transitions and concurrent edits must verify `updatedAt` timestamps or document preconditions to prevent race conditions[cite: 7, 8].

---

## 3. Query Protection & Cost Control (Unbounded Reads)
- **Mandatory Safe Limit**: All list and search queries must enforce a hard upper bound via `.limit(safeLimit)` (e.g., `Math.min(100, limit)`) to prevent quota exhaustion[cite: 6].
- **Cursor Pagination**: Large dataset queries must implement token-based or cursor-based pagination using `.startAfter(startDoc)`[cite: 6].
- **Materialized Queries**: Avoid client-side filtering on large result sets; leverage materialized array fields (e.g., `years: array-contains`) and prefix search indexes[cite: 6].