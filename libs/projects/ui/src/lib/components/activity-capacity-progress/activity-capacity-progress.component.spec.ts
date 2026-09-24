import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { ActivityCapacityProgressComponent } from './activity-capacity-progress.component';

describe('ActivityCapacityProgressComponent', () => {
  let component: ActivityCapacityProgressComponent;
  let fixture: ComponentFixture<ActivityCapacityProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ActivityCapacityProgressComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { shared: { capacity: { unlimited: 'Unlimited' } } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCapacityProgressComponent);
    component = fixture.componentInstance;

    // Satisfy required signal input to avoid NG0950 error during initialization
    fixture.componentRef.setInput('current', 0);
    fixture.detectChanges();
  });

  it('should create component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Capacity Computation & Clamping Logic', () => {
    it('should compute exact rounded percentage when quota is defined', () => {
      // 5 out of 20 participants => 25%
      fixture.componentRef.setInput('current', 5);
      fixture.componentRef.setInput('max', 20);

      expect(component.resolvedPercentage()).toBe(25);
      expect(component.resolvedIsFull()).toBe(false);
    });

    it('should clamp percentage to 100% when current enrolled exceeds maximum quota', () => {
      // Over-enrolled state (25/20) must not exceed 100%
      fixture.componentRef.setInput('current', 25);
      fixture.componentRef.setInput('max', 20);

      expect(component.resolvedPercentage()).toBe(100);
      expect(component.resolvedIsFull()).toBe(true);
    });

    it('should fallback to 0% and not full if max is zero or negative', () => {
      fixture.componentRef.setInput('current', 10);
      fixture.componentRef.setInput('max', 0);

      expect(component.resolvedPercentage()).toBe(0);
      expect(component.resolvedIsFull()).toBe(false);
    });

    it('should prioritize explicit percentage and isFull override inputs', () => {
      // Set values that conflict with calculated inputs to verify override precedence
      fixture.componentRef.setInput('current', 2);
      fixture.componentRef.setInput('max', 10);
      fixture.componentRef.setInput('percentage', 95);
      fixture.componentRef.setInput('isFull', true);

      expect(component.resolvedPercentage()).toBe(95);
      expect(component.resolvedIsFull()).toBe(true);
    });
  });

  describe('Capped Capacity Template Rendering', () => {
    it('should render primary bar when progress is below 80%', () => {
      fixture.componentRef.setInput('current', 50);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      const progressFill = fixture.debugElement.query(By.css('.progress-fill'));
      const textSpan = fixture.debugElement.query(By.css('.fw-semibold.font-monospace'));

      expect(progressFill.nativeElement.classList).toContain('bg-primary');
      expect(progressFill.nativeElement.style.width).toBe('50%');
      expect(textSpan.nativeElement.textContent.trim()).toBe('50/100');
      expect(textSpan.nativeElement.classList).not.toContain('text-danger');
    });

    it('should render warning bar when progress is between 80% and 99%', () => {
      fixture.componentRef.setInput('current', 85);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      const progressFill = fixture.debugElement.query(By.css('.progress-fill'));

      expect(progressFill.nativeElement.classList).toContain('bg-warning');
      expect(progressFill.nativeElement.classList).not.toContain('bg-danger');
    });

    it('should render danger bar and highlight text in red when capacity is fully saturated', () => {
      fixture.componentRef.setInput('current', 100);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();

      const progressFill = fixture.debugElement.query(By.css('.progress-fill'));
      const textSpan = fixture.debugElement.query(By.css('.fw-semibold.font-monospace'));

      expect(progressFill.nativeElement.classList).toContain('bg-danger');
      expect(textSpan.nativeElement.classList).toContain('text-danger');
    });
  });

  describe('Uncapped Capacity Template Rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('current', 12);
      fixture.componentRef.setInput('max', null);
      fixture.detectChanges();
    });

    it('should render uncapped container with infinity symbol when max is null', () => {
      const uncappedContainer = fixture.debugElement.query(By.css('.uncapped-container'));
      const cappedContainer = fixture.debugElement.query(By.css('.enrollment-container'));

      expect(uncappedContainer).toBeTruthy();
      expect(cappedContainer).toBeFalsy();
      expect(uncappedContainer.nativeElement.textContent).toContain('12');
      expect(uncappedContainer.nativeElement.textContent).toContain('∞');
      expect(uncappedContainer.nativeElement.textContent).toContain('Free');
    });

    it('should render custom fallbackIcon when specified', () => {
      fixture.componentRef.setInput('fallbackIcon', 'groups');
      fixture.detectChanges();

      const matIcon = fixture.debugElement.query(By.css('.uncapped-container mat-icon'));
      expect(matIcon.nativeElement.textContent.trim()).toBe('groups');
    });
  });
});