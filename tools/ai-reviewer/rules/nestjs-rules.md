# NESTJS ARCHITECTURAL & DESIGN RULES

Review all backend modules (`apps/backend/**`, `libs/**/features-backend`, `libs/**/data-access-backend`) against these enterprise standards.

---

## 1. Controller Layer (`features-backend`)
- **Thin Controller Principle**: Controllers must only receive incoming requests, validate route params/DTOs, delegate logic to the injected backend service (`<feature>.service.ts`), and return formatted responses[cite: 8].
- **Forbidden in Controllers**:
  - Direct business calculations or data transformations[cite: 8].
  - Injecting database instances or repositories directly[cite: 8].
  - Catching generic errors to return ad-hoc status payloads.

---

## 2. Input Validation & DTO Architecture (`features-backend/src/lib/dtos`)
- **Mandatory Validation**: Every request payload (`@Body()`, `@Query()`, `@Param()`) MUST use an explicit DTO class[cite: 8].
- **Validation Decorators**: All DTO fields must be decorated with `class-validator` rules (`@IsString()`, `@IsNumber()`, `@IsNotEmpty()`, `@IsOptional()`, etc.).
- **Coercion**: Use `@Type(() => Number)` or `@Type(() => Date)` from `class-transformer` for query and path parameters.
- **Strict Whitelist**: Raw `any` or loose inline object parameters in controllers are prohibited.

---

## 3. Domain Service Layer (`data-access-backend/src/lib/services`)
- **Repository Abstraction Dependency**:
  - Domain services (`<feature>.service.ts`) MUST depend exclusively on abstract repository classes (e.g., `ProjectRepository` in `repositories/abstracts/`)[cite: 7, 8].
  - **Zero Tolerance**: Directly injecting concrete implementations (e.g., `FirestoreProjectRepository`, `FirebaseBaseRepository`) into a domain service is strictly prohibited[cite: 6, 8].
- **Dependency Injection**: Use standard constructor injection with readonly tokens[cite: 8]. Never use `new MyService()` or manual instantiation[cite: 8].
- **Domain Exceptions**: When validation fails or business rules are violated, throw strongly typed exceptions located in `data-access-backend/src/lib/exceptions/` (e.g., `ProjectNotFoundException`, `ProjectRosterLockedException`)[cite: 5, 8].
- **Logging**: Use NestJS `Logger` (`private readonly logger = new Logger(ServiceName.name)`). Disallow `console.log`.