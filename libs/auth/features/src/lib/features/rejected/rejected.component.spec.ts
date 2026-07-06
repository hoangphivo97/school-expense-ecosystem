import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RejectedComponent } from './rejected.component';
import { describe, beforeEach, it , expect} from '@jest/globals';

describe('RejectedComponent', () => {
  let component: RejectedComponent;
  let fixture: ComponentFixture<RejectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectedComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
