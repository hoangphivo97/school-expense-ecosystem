import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageJoinCodeLayoutComponent } from './manage-join-code-layout.component';

describe('ManageJoinCodeLayoutComponent', () => {
  let component: ManageJoinCodeLayoutComponent;
  let fixture: ComponentFixture<ManageJoinCodeLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageJoinCodeLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageJoinCodeLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
