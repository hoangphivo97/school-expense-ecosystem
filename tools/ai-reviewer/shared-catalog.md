# SHARED UTILITIES & REUSABLE HELPERS CATALOG

When reviewing pull requests, strictly verify if the author reimplemented logic that already exists in these shared modules. Flag any duplicate implementations and mandate importing from `@school-expense-ecosystem/shared/utils` or corresponding public API paths.

---

## 1. Reactive & Signal Utilities
- **`toDebouncedSignal<T>(source: Signal<T>, delay = 300): Signal<T>`**
  - **Path**: `@school-expense-ecosystem/shared/utils/debounce-signal-helper`
  - **Purpose**: Creates a debounced read-only Signal from a source Signal using internal `effect()` cleanup handlers.
  - **Violation Trigger**: Implementing manual `setTimeout` or RxJS `debounceTime` operators solely to throttle or debounce Signal emissions.

- **`trackLoading<T>(loadingSignal: WritableSignal<boolean>)`**
  - **Path**: `@school-expense-ecosystem/shared/utils/loading-tracker.operator`
  - **Purpose**: RxJS custom operator that sets `loadingSignal` to `true` on subscription (`defer`) and reverts to `false` on completion or error (`finalize`).
  - **Violation Trigger**: Manually mutating `loading.set(true)` before subscription and calling `loading.set(false)` inside `tap`, `catchError`, or `finalize` blocks.

---

## 2. Date, Time & Firestore Utilities
- **`tsToMs(ts: Timestamp): number`**
  - **Path**: `@school-expense-ecosystem/shared/utils/custom-date`
  - **Purpose**: Safely converts Firebase/Firestore `Timestamp` (class instances and serialized objects) to epoch milliseconds.
- **`tsToDate(ts: Timestamp): Date | null`**
  - **Path**: `@school-expense-ecosystem/shared/utils/custom-date`
  - **Purpose**: Safely converts Firebase `Timestamp` to a native JavaScript `Date` instance (returns `null` if invalid).
- **`CustomDateAdapter`**
  - **Path**: `@school-expense-ecosystem/shared/utils/custom-date`
  - **Purpose**: Standard Angular Material Date Adapter enforcing the `DD/MM/YYYY` format display.
  - **Violation Trigger**: Writing manual timestamp arithmetic (`ts.seconds * 1000`) or custom `DD/MM/YYYY` date parsing/formatting routines in feature libraries.

---

## 3. Media & File Processing
- **`compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File>`**
  - **Path**: `@school-expense-ecosystem/shared/utils/image-compression.util`
  - **Purpose**: Compresses images off-screen via HTML5 Canvas, maintains aspect ratio, and exports an optimized JPEG file.
  - **Violation Trigger**: Invoking `document.createElement('canvas')` directly within components/services to perform image resizing or quality compression.

---

## 4. UI Data Formatting & Filtering
- **`createFilterOptionsFromEnum<T>(enumObj: T, translationPrefix: string, allLabelKey = 'shared.filter.all')`**
  - **Path**: `@school-expense-ecosystem/shared/utils/filter-option-from-enum.helper`
  - **Purpose**: Transforms a TypeScript `enum` into a dropdown options array `{ value, labelKey }[]`, appending an `ALL` choice.
  - **Violation Trigger**: Writing manual `Object.values(Enum)` loops or mapping routines in components to build dropdown filters.

- **`isMonthFilter(p)` / `isYearFilter(p)`**
  - **Path**: `@school-expense-ecosystem/shared/utils/report.utils`
  - **Purpose**: Type guard functions validating report filtering parameters for month (`{ year, month }`) or year (`{ year }`).

---

## 5. Error Handling & Normalization
- **`getFriendlyErrorMessage(error: any): DialogError`**
  - **Path**: `@school-expense-ecosystem/shared/utils/friendly-error.helper`
  - **Purpose**: Normalizes diverse errors (Firebase Auth, HTTP 400/401/403/409/500 from NestJS, and internal error codes) into structured `DialogError` objects (`title`, `errorMsg`, `hint`).
  - **Violation Trigger**: Catching HTTP/Firebase errors and parsing status codes or raw strings directly inside UI components instead of utilizing this normalizer.

---

## 6. Unit Testing Helpers
- **`provideSharedTranslocoTesting(extraLangs?)`**
  - **Path**: `@school-expense-ecosystem/shared/utils/transloco-testing.util`
  - **Purpose**: Supplies a preconfigured Transloco testing harness loaded with shared dictionaries (`enCommon`, `enShared`, `twCommon`, `twShared`).
  - **Violation Trigger**: Instantiating empty `TranslocoTestingModule.forRoot(...)` blocks or mocking raw translation keys manually in `*.spec.ts` files.