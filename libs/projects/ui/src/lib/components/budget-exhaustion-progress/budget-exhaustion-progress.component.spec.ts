import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetExhaustionProgressComponent } from './budget-exhaustion-progress.component';

describe('BudgetExhaustionProgressComponent', () => {
  let component: BudgetExhaustionProgressComponent;
  let fixture: ComponentFixture<BudgetExhaustionProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetExhaustionProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetExhaustionProgressComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
