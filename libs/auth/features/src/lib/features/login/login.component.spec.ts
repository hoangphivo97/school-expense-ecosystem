import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { describe, beforeEach, it , expect} from '@jest/globals';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should create form with two controls", () => {
    expect(component.adminLoginForm.contains('userName')).toBe(true);
    expect(component.adminLoginForm.contains('passWord')).toBe(true);
  })

  it("should navigate to expense list with admin account", () => {
    expect(component.adminLoginForm.setValue({ email: "admin", password: "admin" }));
    component.onAdminLoginSubmitted();
    // expect(component.router.navigate(['/expense-list']))
  })

  it("should failed to login", () => {
    expect(component.adminLoginForm.setValue({ email:"test",password: "test"}));
    component.onAdminLoginSubmitted();
    expect(component).toBe("Login Failed")
  })
});
