import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserFormModalComponent } from './user-form-modal.component';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UserListService } from '@school-expense-ecosystem/admin/data-access';
import { AuthSignalStore, MasterDataStore } from '@school-expense-ecosystem/shared/data-access';
import { NotificationService } from '@school-expense-ecosystem/shared/utils-frontend';
import { DialogActionEnum, FacultyId, Role, UserStatus, UserType } from '@school-expense-ecosystem/shared/types';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('UserFormModalComponent', () => {
  let component: UserFormModalComponent;
  let fixture: ComponentFixture<UserFormModalComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockDialogData = {
    action: DialogActionEnum.Create,
    user: null as any,
  };

  const mockUserListService = {
    provisionUser: jest.fn<(input: any) => any>(),
    updateUser: jest.fn<(uid: string, input: any) => any>(),
  };

  const mockAuthStore = {
    user: signal({
      uid: 'admin-123',
      role: Role.LEVEL_0_ADMIN,
    }),
  };

  const mockMasterDataStore = {
    isLoading: signal(false),
    facultyOptions: signal([
      { value: 'ALL', labelKey: 'shared:filter.options.faculties.ALL', label: 'All Faculties' },
      { value: FacultyId.FIT, labelKey: `shared:filter.options.faculties.${FacultyId.FIT}`, label: 'Faculty of IT' },
    ]),
  };

  const mockNotify = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const setupTestBed = async (dialogData = mockDialogData) => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [
        UserFormModalComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, vi: {} },
          translocoConfig: { availableLangs: ['en', 'vi'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: UserListService, useValue: mockUserListService },
        { provide: AuthSignalStore, useValue: mockAuthStore },
        { provide: MasterDataStore, useValue: mockMasterDataStore },
        { provide: NotificationService, useValue: mockNotify },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  describe('Creation Mode (Provision User)', () => {
    beforeEach(async () => {
      await setupTestBed({ action: DialogActionEnum.Create, user: null });
    });

    it('should create component in CREATE mode', () => {
      expect(component).toBeTruthy();
      expect(component['mode']()).toBe('create');
      expect(component['isEditMode']()).toBe(false);
      expect(component['isDetailMode']()).toBe(false);
    });

    it('should correctly filter faculty options from MasterDataStore', () => {
      const faculties = component['facultyOptions']();
      expect(faculties.length).toBe(1);
      expect(faculties[0].value).toBe(FacultyId.FIT);
    });

    it('should set userType to STAFF and facultyId to null automatically when ADMIN role is selected', () => {
      component['userModel'].update((m) => ({
        ...m,
        role: Role.LEVEL_0_ADMIN,
      }));
      fixture.detectChanges();

      expect(component['userModel']().userType).toBe(UserType.STAFF);
      expect(component['userModel']().facultyId).toBeNull();
    });

    it('should successfully submit form and invoke provisionUser API', () => {
      mockUserListService.provisionUser.mockReturnValue(of({ success: true }));

      // Fill in valid model data for LEVEL_3_USER
      component['userModel'].set({
        email: 'student@university.edu.tw',
        role: Role.LEVEL_3_USER,
        userType: UserType.STUDENT,
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01',
        userCode: 'S10001',
        facultyId: FacultyId.FIT,
        password: '',
        confirmPassword: '',
        status: UserStatus.ACTIVE,
      });

      component['onSubmit']();

      expect(mockUserListService.provisionUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'student@university.edu.tw',
          role: Role.LEVEL_3_USER,
          userType: UserType.STUDENT,
          fullName: 'Test Student',
          userCode: 'S10001',
          facultyId: FacultyId.FIT,
        })
      );
      expect(mockNotify.success).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ isSuccess: true })
      );
    });

    it('should handle API provisioning failure gracefully', () => {
      mockUserListService.provisionUser.mockReturnValue(
        throwError(() => ({ status: 500, error: { errorMsg: 'Email already exists' } }))
      );

      component['userModel'].set({
        email: 'duplicate@university.edu.tw',
        role: Role.LEVEL_3_USER,
        userType: UserType.STUDENT,
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01',
        userCode: 'S10001',
        facultyId: FacultyId.FIT,
        password: '',
        confirmPassword: '',
        status: UserStatus.ACTIVE,
      });

      component['onSubmit']();

      expect(mockUserListService.provisionUser).toHaveBeenCalled();
      expect(mockNotify.error).toHaveBeenCalledWith('Email already exists');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode (Update User)', () => {
    const existingUser = {
      uid: 'user-888',
      email: 'teacher@university.edu.tw',
      role: Role.LEVEL_3_USER,
      userType: UserType.TEACHER,
      fullName: 'Dr. Jane Doe',
      dateOfBirth: '1985-05-20',
      userCode: 'T99001',
      facultyId: FacultyId.FIT,
      status: UserStatus.ACTIVE,
    };

    beforeEach(async () => {
      await setupTestBed({ action: DialogActionEnum.Edit, user: existingUser });
    });

    it('should initialize component in EDIT mode and hydrate form model tree', () => {
      expect(component['mode']()).toBe('edit');
      expect(component['isEditMode']()).toBe(true);

      const model = component['userModel']();
      expect(model.email).toBe('teacher@university.edu.tw');
      expect(model.fullName).toBe('Dr. Jane Doe');
      expect(model.facultyId).toBe(FacultyId.FIT);
    });

    it('should submit form and invoke updateUser API', () => {
      mockUserListService.updateUser.mockReturnValue(of({ success: true }));

      // Modify fullName
      component['userModel'].update((m) => ({ ...m, fullName: 'Dr. Jane Smith' }));

      component['onSubmit']();

      expect(mockUserListService.updateUser).toHaveBeenCalledWith(
        'user-888',
        expect.objectContaining({
          fullName: 'Dr. Jane Smith',
          role: Role.LEVEL_3_USER,
          facultyId: FacultyId.FIT,
        })
      );
      expect(mockNotify.success).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ isSuccess: true })
      );
    });
  });

  describe('Detail Mode & Mode Switching', () => {
    const targetUser = {
      uid: 'user-777',
      email: 'staff@university.edu.tw',
      role: Role.LEVEL_1_FINANCE,
      userType: UserType.STAFF,
      fullName: 'Bob Staff',
      dateOfBirth: '1990-10-10',
      userCode: 'F0001',
      facultyId: null,
      status: UserStatus.ACTIVE,
    };

    beforeEach(async () => {
      await setupTestBed({ action: DialogActionEnum.Detail, user: targetUser });
    });

    it('should initialize component in DETAIL mode', () => {
      expect(component['mode']()).toBe('detail');
      expect(component['isDetailMode']()).toBe(true);
    });

    it('should switch from DETAIL mode to EDIT mode via switchToEditMode()', () => {
      expect(component['isEditMode']()).toBe(false);

      component['switchToEditMode']();

      expect(component['mode']()).toBe('edit');
      expect(component['isEditMode']()).toBe(true);
    });
  });
});