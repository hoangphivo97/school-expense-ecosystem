import { Signal } from '@angular/core';

/**
 * Supported UI input control variants for filter fields
 */
export type FilterControlType = 'search' | 'select';

/**
 * Standard contract for select dropdown options supporting dynamic i18n
 */
export interface FilterOption<T = unknown> {
  value: T;
  /** Transloco translation key (e.g., 'shared.options.roles.ADMIN') */
  labelKey?: string;
  /** Raw text fallback if internationalization is not applicable */
  label?: string;
}

/**
 * Core schema contract defining an individual filter element
 */
export interface FilterFieldConfig<T = unknown> {
  /** Property identifier mapping directly to form control and output payload */
  key: string;

  /** Visual rendering control type */
  type: FilterControlType;

  /** Transloco label key for mat-label */
  labelKey: string;

  /** Transloco placeholder key (primarily utilized for search inputs) */
  placeholderKey?: string;

  /** Initial fallback and reset state value */
  defaultValue: T;

  /**
   * Option collection for select controls.
   * Supports either a static array or a reactive Signal for dynamic master data streaming.
   */
  options?: Signal<FilterOption<T>[]> | FilterOption<T>[];

  /** Optional reactive control state for conditional locking */
  disabled?: Signal<boolean> | boolean;

  /** Custom visual presentation width (default: '165px' for select, '100%' for search) */
  customWidth?: string;
}

/**
 * Generic dictionary representing emitted filter state changes
 */

export type FilterValuePrimitive = string | number | boolean | null | undefined;
export type FilterValues = Record<string, FilterValuePrimitive>;