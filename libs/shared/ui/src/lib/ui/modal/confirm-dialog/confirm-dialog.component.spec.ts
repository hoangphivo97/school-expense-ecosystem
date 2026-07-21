import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn() }
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Delete Expense Record',
            message: 'Are you completely sure you want to permanently purge this school expense sync line?',
            confirmText: 'Yes, Delete',
            cancelText: 'No, Keep It',
            confirmColor: 'warn',
            icon: 'trash-can'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
