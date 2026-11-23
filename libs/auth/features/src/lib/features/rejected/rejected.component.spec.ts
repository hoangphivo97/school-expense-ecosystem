import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RejectedComponent } from './rejected.component';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/test-utils-frontend';
import { enAuth, twAuth } from '@school-expense-ecosystem/shared/assets';

describe('RejectedComponent', () => {
  let component: RejectedComponent;
  let fixture: ComponentFixture<RejectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectedComponent,
        provideSharedTranslocoTesting({
          en: { auth: enAuth },
          tw: { auth: twAuth },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectedComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
