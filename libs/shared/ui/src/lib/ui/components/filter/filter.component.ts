import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource } from '@angular/material/table';
import {
  FilterParams,
} from '@school-expense-ecosystem/shared/types';
import { CommonModule } from '@angular/common';
import { months } from '@school-expense-ecosystem/shared/constants';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'lib-filter',
  standalone: true,
  imports: [
    MatSelect,
    MatOption,
    MatInputModule,
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatTooltipModule,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
})
export class FilterComponent<T = any> implements OnInit {
  private router = inject(Router);
  inputDataSource = input<MatTableDataSource<T>>();

  readonly currMonth: number = new Date().getMonth() + 1;
  readonly currYear: number = new Date().getFullYear();

  private _yearsList: number[] = []; //Will get from list of Expense created Date

  private readonly destroyRef = inject(DestroyRef);

  initFilterState = {
    searchTerm: '',
    month: this.currMonth,
    year: this.currYear,
  };

  filterForm = new FormGroup({
    searchTerm: new FormControl(this.initFilterState.searchTerm),
    month: new FormControl(this.initFilterState.month),
    year: new FormControl(this.initFilterState.year),
  });

  // 1. DATA ENTRY BOUNDARY: Synchronizes URL state from parent directly into the reactive form inputs
  @Input() set value(val: FilterParams | null) {
    if (val) {
      this.filterForm.patchValue({
        month: val.month ?? this.currMonth,
        year: val.year ?? this.currYear,
        searchTerm: val.searchTerm ?? ''
      }, { emitEvent: false }); // CRITICAL: prevent infinite loop routing triggers
    }
  }

  @Input() set yearsList(years: number[]) {
    this._yearsList = [...years];
    if (!this._yearsList.includes(this.currYear)) {
      this._yearsList.push(this.currYear);
    }
    this._yearsList.sort((a: number, b: number) => a - b);
  }

  get yearsList(): number[] {
    return this._yearsList;
  }

  @Output() filterChange = new EventEmitter<FilterParams>();

  ngOnInit(): void {
    this.handleYearSelected();
    this.handleFilter();
  }

  onSearch(event: Event) {
    const dataSource = this.inputDataSource();
    const value: string = (event.target as HTMLInputElement).value;
    const filterdValue: string = value.trim() && value.toLowerCase();
    if (dataSource) {
      dataSource.filter = filterdValue;
    }
  }

  initFilter(emit = true) {
    this.filterForm.setValue({ ...this.initFilterState }, { emitEvent: emit });
  }

  resetFilter() {
    this.initFilter(true);
  }

  handleFilter() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {

        const dataSource = this.inputDataSource();
        if (dataSource) {
          dataSource.filter = (value.searchTerm || '').trim().toLowerCase();
        }

        this.filterChange.emit(value as FilterParams);
      });
  }

  //If currYear not in list then Add it to list
  handleYearSelected() {
    if (!this.yearsList.includes(this.currYear)) {
      this.yearsList.push(this.currYear);
    }
    this.yearsList.sort((a: number, b: number) => a - b);
  }

  get months() {
    return months;
  }

  get hasUserFiltered(): boolean {
    return (
      JSON.stringify(this.filterForm.value) !==
      JSON.stringify(this.initFilterState)
    );
  }

  get isReportPage(): boolean {
    return this.router.url.includes('/report');
  }
}
