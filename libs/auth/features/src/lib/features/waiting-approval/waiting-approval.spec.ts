import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingApproval } from './waiting-approval';

describe('WaitingApproval', () => {
  let component: WaitingApproval;
  let fixture: ComponentFixture<WaitingApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(WaitingApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
