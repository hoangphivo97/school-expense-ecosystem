import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { FilterFieldConfig } from '@school-expense-ecosystem/shared/types';
import { FilterComponent } from './filter.component';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/utils-frontend';


describe('FilterComponent', () => {
  let component: FilterComponent<any>;
  let fixture: ComponentFixture<FilterComponent<any>>;

  const mockConfigs: FilterFieldConfig[] = [
    {
      key: 'searchTerm',
      type: 'search',
      labelKey: 'filter.search',
      defaultValue: '',
    },
    {
      key: 'year',
      type: 'select',
      labelKey: 'filter.year',
      defaultValue: 'ALL',
      options: [
        { value: 'ALL', label: 'All Years' },
        { value: 2026, label: '2026' },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FilterComponent,
        provideSharedTranslocoTesting()
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
  });

  it('should initialize form controls dynamically based on configs input', () => {
    fixture.componentRef.setInput('configs', mockConfigs);
    fixture.detectChanges();

    expect(component.form.contains('searchTerm')).toBe(true);
    expect(component.form.contains('year')).toBe(true);
    expect(component.form.get('year')?.value).toBe('ALL');
  });

  it('should emit filterChange output when a form control value changes', () => {
    fixture.componentRef.setInput('configs', mockConfigs);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.filterChange, 'emit');
    const yearControl = component.form.get('year');

    yearControl?.markAsDirty();
    yearControl?.setValue(2026);

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: '',
        year: 2026,
      })
    );
    expect(component.isDirty()).toBe(true);
  });

  it('should patch form without triggering circular emissions when value input changes', () => {
    fixture.componentRef.setInput('configs', mockConfigs);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.filterChange, 'emit');

    fixture.componentRef.setInput('value', { searchTerm: 'Angular', year: 2026 });
    fixture.detectChanges();

    expect(component.form.get('searchTerm')?.value).toBe('Angular');
    expect(component.form.get('year')?.value).toBe(2026);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should dynamically toggle control disabled state when config signal changes', () => {
    const isFacultyDisabled = signal(false);
    const dynamicConfigs: FilterFieldConfig[] = [
      {
        key: 'facultyId',
        type: 'select',
        labelKey: 'filter.faculty',
        defaultValue: 'IT',
        disabled: isFacultyDisabled,
      },
    ];

    fixture.componentRef.setInput('configs', dynamicConfigs);
    fixture.detectChanges();

    const facultyControl = component.form.get('facultyId');
    expect(facultyControl?.enabled).toBe(true);

    isFacultyDisabled.set(true);
    fixture.detectChanges();

    expect(facultyControl?.disabled).toBe(true);
  });

  it('should filter client-side inputDataSource when search control updates', () => {
    const dataSource = new MatTableDataSource([{ name: 'Project Alpha' }, { name: 'Project Beta' }]);

    fixture.componentRef.setInput('configs', mockConfigs);
    fixture.componentRef.setInput('inputDataSource', dataSource);
    fixture.detectChanges();

    component.form.get('searchTerm')?.setValue('Alpha');

    expect(dataSource.filter).toBe('alpha');
  });

  it('should reset form to defaultState and emit on resetFilters', () => {
    fixture.componentRef.setInput('configs', mockConfigs);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.filterChange, 'emit');
    const yearControl = component.form.get('year');

    yearControl?.markAsDirty();
    yearControl?.setValue(2026);

    expect(component.isDirty()).toBe(true);

    component.resetFilters();

    expect(component.form.get('year')?.value).toBe('ALL');
    expect(component.isDirty()).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: '',
        year: 'ALL',
      })
    );
  });
});