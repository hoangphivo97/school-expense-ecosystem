import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  computed,
  effect,
  signal,
  isSignal,
  untracked,
  Injector,
  runInInjectionContext,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { FilterFieldConfig, FilterOption, FilterValuePrimitive } from '@school-expense-ecosystem/shared/types';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SelectFieldViewModel {
  config: FilterFieldConfig;
}

@Component({
  selector: 'lib-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    TranslocoModule,
    MatPaginatorModule,
    ReactiveFormsModule
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'shared' }
  ]
})
export class FilterComponent<TFilter extends object = Record<string, unknown>, T = unknown> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly configs = input.required<FilterFieldConfig[]>();
  readonly value = input<TFilter | null>(null);
  readonly inputDataSource = input<MatTableDataSource<T> | null>(null);

  readonly filterChange = output<TFilter>();

  readonly defaultState = computed<Record<string, unknown>>(() => {
    return this.configs().reduce((acc, field) => {
      acc[field.key] = field.defaultValue;
      return acc;
    }, {} as Record<string, unknown>);
  });

  form!: FormGroup;
  readonly isDirty = signal<boolean>(false);

  readonly searchField = computed(() => this.configs().find((c) => c.type === 'search'));
  readonly selectConfigs = computed(() => this.configs().filter((c) => c.type === 'select'));

  ngOnInit(): void {
    this.initFormGroup();
    this.bindValueChanges();
  }

  constructor() {
    this.syncDisabledState();
    this.syncIncomingValue();
  }

  private initFormGroup(): void {
    const group: Record<string, FormControl> = {};
    const incoming = this.value() as Record<string, unknown> | null;

    for (const cfg of this.configs()) {
      const isDisabled = this.resolveFieldDisabled(cfg);
      // Seed with incoming parent state if present, fallback to default value
      const initialVal = incoming?.[cfg.key] ?? cfg.defaultValue ?? null;

      group[cfg.key] = new FormControl({
        value: initialVal,
        disabled: isDisabled
      });
    }
    this.form = new FormGroup(group);
  }

  private bindValueChanges(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.isDirty.set(this.form.dirty);

        // Synchronize local table data source if search control exists
        const searchConfig = this.searchField();
        const dataSource = this.inputDataSource();
        if (dataSource && searchConfig) {
          const query = val[searchConfig.key];
          dataSource.filter = typeof query === 'string' ? query.trim().toLowerCase() : '';
        }

        // Emit complete state snapshot including disabled fields
        this.filterChange.emit(this.form.getRawValue() as TFilter);
      });
  }

  private syncDisabledState(): void {
    // Reactively toggle control availability when parent conditions mutate
    effect(() => {
      if (!this.form) return;
      for (const cfg of this.configs()) {
        if (cfg.disabled !== undefined) {
          const ctrl = this.form.get(cfg.key);
          if (ctrl) {
            const shouldDisable = this.resolveFieldDisabled(cfg);
            if (shouldDisable && ctrl.enabled) {
              ctrl.disable({ emitEvent: false });
            } else if (!shouldDisable && ctrl.disabled) {
              ctrl.enable({ emitEvent: false });
            }
          }
        }
      }
    });
  }

  private syncIncomingValue(): void {
    // Safely apply parent values without triggering circular event emissions
    effect(() => {
      const incoming = this.value();
      if (!this.form || !incoming) return;

      this.form.patchValue(incoming as any, { emitEvent: false });
    });
  }

  resolveFieldOptions(field: FilterFieldConfig): FilterOption[] {
    if (!field.options) return [];
    return isSignal(field.options) ? field.options() : field.options;
  }

  resolveFieldDisabled(field: FilterFieldConfig): boolean {
    if (field.disabled === undefined) return false;
    return isSignal(field.disabled) ? field.disabled() : field.disabled;
  }

  resetFilters(): void {
    this.form.reset(this.defaultState(), { emitEvent: false });
    this.isDirty.set(false);
    this.filterChange.emit(this.form.getRawValue() as TFilter);
  }
}