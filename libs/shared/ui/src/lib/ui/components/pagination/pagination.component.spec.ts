import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/utils-frontend';


describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaginationComponent,
        provideSharedTranslocoTesting() // Clean abstraction using our real translations helper
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should prevent out-of-bounds event emissions when boundary clicks are intercepted', () => {
    // Setup initial state on the edge boundary (Page index 2 is the 3rd/last page)
    fixture.componentRef.setInput('totalItems', 30);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('currentPage', 2);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.pageChange, 'emit');

    // Action: Attempt out-of-bounds navigation click
    component.selectPage(3);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should instantly recalculate maximum pages computed metric when input parameters mutate', () => {
    fixture.componentRef.setInput('totalItems', 100);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(10);

    fixture.componentRef.setInput('pageSize', 25);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(4);
  });
});