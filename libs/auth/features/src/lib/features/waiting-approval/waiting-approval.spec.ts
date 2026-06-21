import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingApprovalComponent } from './waiting-approval';
import { describe, beforeEach, it , expect} from '@jest/globals';

describe('WaitingApprovalComponent', () => {
  let component: WaitingApprovalComponent;
  let fixture: ComponentFixture<WaitingApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingApprovalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WaitingApprovalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
