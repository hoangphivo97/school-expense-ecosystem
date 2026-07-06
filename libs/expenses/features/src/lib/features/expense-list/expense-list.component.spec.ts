import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseList, PaidMethodEnum } from '@school-expense-ecosystem/shared/types';
import { of, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseService } from '@school-expense-ecosystem/expenses/data-access'; 
import { MatTableModule } from '@angular/material/table';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTableHarness } from '@angular/material/table/testing';
import { expect, describe, it, beforeEach, jest } from '@jest/globals'; 
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SettingsServiceService } from '@school-expense-ecosystem/shared/ui'; 

class MockExpeseService {
  private _$ = new Subject<ExpenseList[]>();
  getExpense() {
    return this._$.asObservable();
  }
  emit(data: ExpenseList[]) {
    this._$.next(data);
  }
  delete = jest.fn();
}

class MockDialog {
  open = jest.fn().mockReturnValue({
    afterClose: () => of(true),
  });
}

const mockSettingsService = {
  getSettings: jest.fn().mockReturnValue(of({ theme: 'dark' })),
};

describe('ExpenseListComponent', () => {
  let fixture: ComponentFixture<ExpenseListComponent>;
  let svc: MockExpeseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseListComponent, NoopAnimationsModule, MatTableModule],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        { provide: ExpenseService, useClass: MockExpeseService },
        { provide: MatDialog, useClass: MockDialog },
      ],
    })
      .overrideProvider(ExpenseService, { useValue: MockExpeseService })
      .overrideProvider(SettingsServiceService, {
        useValue: mockSettingsService,
      })
      .compileComponents();

    fixture = TestBed.createComponent(ExpenseListComponent);
    svc = TestBed.inject(ExpenseService) as unknown as MockExpeseService;
    fixture.detectChanges();
  });

  it('Should render expense rows from service data', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const data: ExpenseList[] = [
      {
        id: '1',
        date: { toDate: () => new Date('2025-09-11') } as any,
        description: 'Cà phê',
        purpose: 'test',
        paid: PaidMethodEnum.CASH,
        for: 'Me',
        amount: 45000,
        createdAt: new Date('2025-09-11T00:00:00.000Z'),
      },
    ];

    svc.emit(data);
    fixture.detectChanges();

    const table = await loader.getHarness(MatTableHarness);
    const rows = await table.getRows();

    expect(rows.length).toBe(1);

    const firstRowCells = await rows[0].getCellTextByIndex();
    expect(firstRowCells).toContain('Cà phê');
    expect(firstRowCells).toContain('45,000');
  });
});