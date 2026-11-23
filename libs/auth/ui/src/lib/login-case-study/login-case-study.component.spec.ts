import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginCaseStudyComponent } from './login-case-study.component';

describe('LoginCaseStudyComponent', () => {
  let component: LoginCaseStudyComponent;
  let fixture: ComponentFixture<LoginCaseStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginCaseStudyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginCaseStudyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
