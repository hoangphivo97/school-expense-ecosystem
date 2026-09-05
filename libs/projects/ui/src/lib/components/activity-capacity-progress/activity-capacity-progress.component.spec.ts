import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCapacityProgressComponent } from './activity-capacity-progress.component';

describe('ActivityCapacityProgressComponent', () => {
  let component: ActivityCapacityProgressComponent;
  let fixture: ComponentFixture<ActivityCapacityProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityCapacityProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCapacityProgressComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
