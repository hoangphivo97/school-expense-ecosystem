import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsModalComponent } from './settings-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let fixture: ComponentFixture<SettingsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SettingsModalComponent);
    component = fixture.componentInstance;

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
})
