# NX ARCHITECTURAL BOUNDARY & LIBRARY STRUCTURE RULES

You are an automated Gatekeeper enforcing monorepo taxonomy, boundary encapsulation, and strict naming conventions. Violations must trigger an immediate REJECT verdict.

---

## 1. Library Classification & Responsibilities
Every domain under `libs/<domain>/` must adhere to standard layer separation:

1. **`data-access` (Frontend Client Layer)**:
   - **Contents**: HTTP API services, Signal stores (`auth-signal.store.ts`), and client-side reactive state.
   - **Naming Convention**: All API client services MUST follow the pattern `<feature>-api.service.ts` (e.g., `project-api.service.ts`, `budget-api.service.ts`).
   - **Forbidden**: Placing NestJS injectable services, database drivers, or server-side repositories here.

2. **`data-access-backend` (Backend Core Layer)**:
   - **Contents**: Backend domain services, repository contracts (`abstracts/`), repository implementations (`infrastructure/`), domain exceptions (`exceptions/`), mappers, and domain helpers.
   - **Naming Convention**: Backend services MUST follow the pattern `<feature>.service.ts` (e.g., `project.service.ts`, `event.service.ts`).
   - **Forbidden**: Importing Angular Signal primitives, Material modules, or browser APIs.

3. **`features` (Frontend Smart Layer)**:
   - **Contents**: Smart components, routable pages, dialogs, and route configs (`*.routes.ts`).
   - **Forbidden**: Direct database calls or bypassing the `data-access` layer.

4. **`features-backend` (Backend Presentation Layer)**:
   - **Contents**: NestJS controllers (`*.controller.ts`), request/response DTOs (`dtos/**`), and endpoint-level decorators.
   - **Forbidden**: Housing domain business logic, calculations, or raw database queries.

5. **`guards-backend`**:
   - **Contents**: Backend authentication guards, role guards, throttlers, and execution policies.

6. **`ui` (Frontend Dumb/Presentational Layer)**:
   - **Contents**: Pure presentational components, dumb layouts, and stateless presentation elements.
   - **Forbidden**: Injecting domain services, making HTTP calls, or reading router state directly.

7. **`types` (Domain Model Layer)**:
   - **Contents**: Enums, interfaces, model entities, and API payloads.
   - **Rule**: Leaf node; must not contain executable business logic or heavy runtime dependencies.

8. **`utils` (Shared Helpers)**:
   - **Contents**: Stateless pure utility functions.

---

## 2. Dependency Constraints Parity (ESLint Rules)
Enforce the following dependency graph restrictions:

1. **Domain Scope Boundaries**:
   - **`scope:app`**: May ONLY depend on `scope:auth`, `scope:expenses`, `scope:shared`, `scope:finance`, `scope:dashboard`, `scope:admin`.
   - **`scope:backend`**: May ONLY depend on `scope:backend`, `scope:auth`, `scope:finance`, `scope:shared`, `scope:admin`, `scope:expenses`.
   - **`scope:auth`**: May ONLY depend on `scope:auth`, `scope:shared`, `scope:features`, `scope:data-access`, `scope:data-access-backend`.
   - **`scope:expenses`**: May ONLY depend on `scope:expenses`, `scope:shared`.
   - **`scope:finance`**: May ONLY depend on `scope:finance`, `scope:auth`, `scope:shared`.
   - **`scope:admin`**: May ONLY depend on `scope:admin`, `scope:shared`, `scope:auth`.
   - **`scope:shared`**: May ONLY depend on `scope:shared`. Importing from any domain-specific scope into `scope:shared` is strictly forbidden.

2. **Library Type Hierarchy**:
   - **`type:ui`**: May ONLY depend on `type:ui`, `type:shared-utils`, `type:types`, `type:constants`, `type:data-access`.
   - **`type:data-access`**: May ONLY depend on `type:shared-utils`, `type:types`, `type:constants`, `type:data-access`. Must NEVER import `type:ui`.
   - **`type:shared-utils`**: May ONLY depend on `type:types`, `type:constants`.
   - **`type:types` & `type:constants`**: Leaf libraries; may ONLY depend on `type:types`.

3. **Encapsulation & Barrel Exports**:
   - Cross-library imports MUST use the root path alias defined in `tsconfig.base.json` (e.g., `@school-expense-ecosystem/projects/data-access-backend`).
   - Deep imports accessing internal library structures (e.g., `../../src/lib/...`) are strictly prohibited.