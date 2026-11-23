import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/test-utils-frontend';
import { enAuth, twAuth } from '@school-expense-ecosystem/shared/assets';
import { LoginCaseStudyComponent } from './login-case-study.component';

describe('LoginCaseStudyComponent', () => {
  let component: LoginCaseStudyComponent;
  let fixture: ComponentFixture<LoginCaseStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginCaseStudyComponent,
        provideSharedTranslocoTesting({
          en: { auth: enAuth },
          tw: { auth: twAuth },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginCaseStudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  describe('Workflow & Onboarding Documentation Rendering', () => {
    it('should render localized case study heading and all 3 approval tiers with execution gate', () => {
      const host: HTMLElement = fixture.nativeElement;
      const approvalSteps = host.querySelectorAll('.pipeline-step');
      const executionGate = host.querySelector('.execution-gate-row');

      expect(approvalSteps.length).toBe(3);
      expect(executionGate).not.toBeNull();
      expect(host.textContent).toContain(enAuth.showcase.title);
    });

    it('should render all 4 JIT onboarding steps', () => {
      const host: HTMLElement = fixture.nativeElement;
      const onboardingSteps = host.querySelectorAll('.onboarding-step-item');

      expect(onboardingSteps.length).toBe(4);
      expect(host.textContent).toContain(enAuth.showcase.jit.step1Title);
      expect(host.textContent).toContain(enAuth.showcase.jit.step4Title);
    });
  });

  describe('User Interactions & Navigation Events', () => {
    it('should emit exploreDossier when the architecture gateway card is clicked', () => {
      const emitSpy = jest.spyOn(component.exploreDossier, 'emit');
      const gatewayCard: HTMLButtonElement | null =
        fixture.nativeElement.querySelector('.dossier-gateway-card');

      expect(gatewayCard).not.toBeNull();
      gatewayCard?.click();

      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });
});