import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityFormLayoutComponent } from './activity-form-layout.component';
import { beforeEach, describe, it} from 'node:test';

describe('ActivityFormLayoutComponent', () => {
  let component: ActivityFormLayoutComponent;
  let fixture: ComponentFixture<ActivityFormLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFormLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityFormLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
