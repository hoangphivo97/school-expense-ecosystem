import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinCodeDialogComponent } from './join-code-dialog.component';

describe('JoinCodeDialogComponent', () => {
  let component: JoinCodeDialogComponent;
  let fixture: ComponentFixture<JoinCodeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinCodeDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinCodeDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
