import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageJoinCodeDialogComponent } from './manage-join-code-dialog.component';

describe('ManageJoinCodeDialogComponent', () => {
  let component: ManageJoinCodeDialogComponent;
  let fixture: ComponentFixture<ManageJoinCodeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageJoinCodeDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageJoinCodeDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
