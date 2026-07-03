import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDeleteModal } from './user-delete-modal';

describe('UserDeleteModal', () => {
  let component: UserDeleteModal;
  let fixture: ComponentFixture<UserDeleteModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDeleteModal],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDeleteModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
