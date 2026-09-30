import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectLayoutComponent } from './project-layout.component';
import { provideSharedTranslocoTesting } from '@school-expense-ecosystem/shared/utils-frontend';

describe('ProjectLayoutComponent', () => {
  let component: ProjectLayoutComponent;
  let fixture: ComponentFixture<ProjectLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLayoutComponent,
        provideSharedTranslocoTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
