import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { ActivityFormLayoutComponent } from './activity-form-layout.component';

describe('ActivityFormLayoutComponent', () => {
  let component: ActivityFormLayoutComponent;
  let fixture: ComponentFixture<ActivityFormLayoutComponent>;
  let testForm: FormGroup;

  const createTestForm = () =>
    new FormGroup({
      name: new FormControl('', Validators.required),
      facultyId: new FormControl(''),
      budgetCap: new FormControl(null),
      initialSpent: new FormControl(null),
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      description: new FormControl(''),
      generateJoinCode: new FormControl(false),
      maxUses: new FormControl(null),
      expiresAt: new FormControl(null),
    });

  beforeEach(async () => {
    testForm = createTestForm();

    await TestBed.configureTestingModule({
      imports: [
        ActivityFormLayoutComponent,
        ReactiveFormsModule,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              project: {
                createDialog: {
                  title: 'Create Activity',
                  subtitle: 'Fill details below',
                  editTitle: 'Edit Activity',
                  detailTitle: 'Activity Details',
                  detailSubtitle: 'Overview mode',
                  warnings: {
                    invalidDateRange: 'End date must be after start date',
                    initialSpentExceedsBudget: 'Initial spent cannot exceed budget cap',
                  },
                  fields: {
                    name: { label: 'Name', placeholder: 'Enter name' },
                    faculty: { label: 'Faculty' },
                    budgetCap: { label: 'Budget Cap' },
                    initialSpent: { label: 'Initial Spent', hint: 'Baseline amount' },
                    startDate: { label: 'Start Date' },
                    endDate: { label: 'End Date' },
                    description: { label: 'Description', placeholder: 'Enter notes' },
                  },
                  invitationCode: {
                    toggleTitle: 'Generate Join Code',
                    toggleSubtitle: 'Allow auto-join',
                    panelTitle: 'Join Code Configuration',
                    pendingApprovalNotice: 'Pending approval notice',
                  },
                  actions: {
                    submit: 'Submit',
                    update: 'Update',
                    submitting: 'Saving...',
                    cancel: 'Cancel',
                    close: 'Close',
                  },
                },
              },
            },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityFormLayoutComponent);
    component = fixture.componentInstance;

    // Satisfy required form input
    fixture.componentRef.setInput('form', testForm);
    fixture.detectChanges();
  });

  it('should initialize and bind reactive form correctly', () => {
    expect(component).toBeTruthy();
    expect(component.form()).toBe(testForm);
  });

  describe('Mode Presentation Matrix', () => {
    it('should render creation mode headers and default submit button', () => {
      const title = fixture.debugElement.query(By.css('.main-title-text'));
      const submitBtn = fixture.debugElement.query(By.css('.submit-btn'));

      expect(title.nativeElement.textContent.trim()).toBe('Create Activity');
      expect(submitBtn.nativeElement.textContent).toContain('Submit');
    });

    it('should render edit mode headers and update button text', () => {
      fixture.componentRef.setInput('isEditMode', true);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.main-title-text'));
      const submitBtn = fixture.debugElement.query(By.css('.submit-btn'));

      expect(title.nativeElement.textContent.trim()).toBe('Edit Activity');
      expect(submitBtn.nativeElement.textContent).toContain('Update');
    });

    it('should render readonly detail mode with single Close action button', () => {
      fixture.componentRef.setInput('isDetailMode', true);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.main-title-text'));
      const subtitle = fixture.debugElement.query(By.css('.sub-title-text'));
      const submitBtn = fixture.debugElement.query(By.css('.submit-btn'));
      const closeBtn = fixture.debugElement.query(By.css('mat-dialog-actions button'));

      expect(title.nativeElement.textContent.trim()).toBe('Activity Details');
      expect(subtitle.nativeElement.textContent.trim()).toBe('Overview mode');
      expect(submitBtn).toBeFalsy();
      expect(closeBtn.nativeElement.textContent.trim()).toBe('Close');
    });
  });

  describe('Banner Notifications', () => {
    it('should render error banner when errorMessage input is set', () => {
      fixture.componentRef.setInput('errorMessage', 'Server validation failed');
      fixture.detectChanges();

      const errorBanner = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorBanner.nativeElement.textContent).toContain('Server validation failed');
    });

    it('should render date range warning when form error is set and fields are touched', () => {
      testForm.setErrors({ invalidDateRange: true });
      testForm.get('endDate')?.markAsTouched();
      fixture.detectChanges();

      const warningBanner = fixture.debugElement.query(By.css('.alert-warning'));
      expect(warningBanner.nativeElement.textContent).toContain('End date must be after start date');
    });

    it('should render budget limit warning when initial spent exceeds budget cap', () => {
      testForm.setErrors({ initialSpentExceedsBudget: true });
      testForm.get('initialSpent')?.markAsTouched();
      fixture.detectChanges();

      const warningBanner = fixture.debugElement.query(By.css('.alert-warning'));
      expect(warningBanner.nativeElement.textContent).toContain('Initial spent cannot exceed budget cap');
    });
  });

  describe('Secondary Slide-out Join Code Panel', () => {
    it('should open join code settings drawer when toggle is active in Create mode', () => {
      testForm.get('generateJoinCode')?.setValue(true);
      fixture.detectChanges();

      const secondaryCard = fixture.debugElement.query(By.css('.secondary-modal-card'));
      expect(secondaryCard).toBeTruthy();
    });

    it('should close secondary drawer when close button on panel is clicked', () => {
      testForm.get('generateJoinCode')?.setValue(true);
      fixture.detectChanges();

      const closePanelBtn = fixture.debugElement.query(By.css('.secondary-modal-card button[mat-icon-button]'));
      closePanelBtn.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(testForm.get('generateJoinCode')?.value).toBe(false);
      expect(fixture.debugElement.query(By.css('.secondary-modal-card'))).toBeFalsy();
    });

    it('should show pending approval notice if activity is not immediately active', () => {
      testForm.get('generateJoinCode')?.setValue(true);
      fixture.componentRef.setInput('isImmediatelyActive', false);
      fixture.detectChanges();

      const notice = fixture.debugElement.query(By.css('.secondary-modal-card .alert-info'));
      expect(notice.nativeElement.textContent).toContain('Pending approval notice');
    });
  });

  describe('Actions & Output Event Emissions', () => {
    it('should emit cancelForm when Cancel or Close button is clicked', () => {
      const cancelSpy = jest.fn();
      component.cancelForm.subscribe(cancelSpy);

      const cancelBtn = fixture.debugElement.query(By.css('.cancel-btn'));
      cancelBtn.triggerEventHandler('click', null);

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit submitForm when form is valid and submit button is clicked', () => {
      const submitSpy = jest.fn();
      component.submitForm.subscribe(submitSpy);

      testForm.get('name')?.setValue('Valid Activity Name');
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.submit-btn'));
      expect(submitBtn.nativeElement.disabled).toBe(false);

      submitBtn.triggerEventHandler('click', null);
      expect(submitSpy).toHaveBeenCalledTimes(1);
    });

    it('should disable submit button and show spinning icon when isSubmitting is true', () => {
      testForm.get('name')?.setValue('Valid Activity Name');
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      const submitBtn = fixture.debugElement.query(By.css('.submit-btn'));
      const icon = fixture.debugElement.query(By.css('.submit-btn mat-icon'));

      expect(submitBtn.nativeElement.disabled).toBe(true);
      expect(icon.nativeElement.classList).toContain('spinning');
      expect(icon.nativeElement.textContent.trim()).toBe('sync');
    });

    it('should emit amountInput when amount fields trigger onAmountChange', () => {
      const amountSpy = jest.fn();
      component.amountInput.subscribe(amountSpy);

      const fakeEvent = new Event('input');
      component.onAmountChange(fakeEvent, 'budgetCap');

      expect(amountSpy).toHaveBeenCalledWith({
        event: fakeEvent,
        controlName: 'budgetCap',
      });
    });
  });
});