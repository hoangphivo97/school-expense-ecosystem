import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';
import { describe, beforeEach, it , expect, jest} from '@jest/globals';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('should prevent out-of-bounds event emissions when boundary clicks are intercepted', () => {
    // Setup initial state on the edge boundary (Page 3 of 3)
    fixture.componentRef.setInput('totalItems', 30);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.pageChange, 'emit');

    // Action: Attempt out-of-bounds navigation click
    component.selectPage(4);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should instantly recalculate maximum pages computed metric when input parameters mutate', () => {
    // Setup base limits (100 items / 10 per page = 10 pages calculated)
    fixture.componentRef.setInput('totalItems', 100);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    expect(component.totalPages()).toBe(10);

    // Action: Mutate data partition payload size reactively
    fixture.componentRef.setInput('pageSize', 25);
    fixture.detectChanges();

    // Verification: Computed token shifting must register instantly (100 / 25 = 4 pages)
    expect(component.totalPages()).toBe(4);
  });
});