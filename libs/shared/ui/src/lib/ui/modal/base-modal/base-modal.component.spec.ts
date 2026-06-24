// libs/shared/ui/src/lib/ui/modal/base-modal/base-modal.component.spec.ts

import { TestBed } from '@angular/core/testing';
import { BaseModalComponent, BaseModalData } from './base-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('BaseModalComponent (Pure Unit Test)', () => {
  let component: BaseModalComponent;
  let mockDialogRef: { close: jest.Mock };
  let mockModalData: BaseModalData;

  beforeEach(() => {
    // RESOLVED JASMINE COMPILER BUG: Utilizing Jest native mocking primitives
    mockDialogRef = {
      close: jest.fn()
    };
    
    mockModalData = {
      title: 'Suspend Account',
      message: 'An explicit administrative trail reason is mandatory.',
      placeholder: 'Enter formal reasoning context...'
    };

    TestBed.configureTestingModule({
      providers: [
        BaseModalComponent, // Resolve component instance strictly as a class provider interface
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockModalData }
      ]
    });

    component = TestBed.inject(BaseModalComponent);
  });

  it('should create the component instance safely', () => {
    expect(component).toBeTruthy();
  });

  describe('onCancel', () => {
    it('should close the dialog window with a null payload', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });

  describe('onSave', () => {
    it('should close the dialog window with trimmed reason text when input is valid', () => {
      // Set value with outer padding spaces to verify the trimming filter routine
      component.reasonText.set('   Account terms violation detailed   ');
      
      component.onSave();
      
      expect(mockDialogRef.close).toHaveBeenCalledWith('Account terms violation detailed');
    });

    it('should refuse to close the dialog window when reason text is an empty string', () => {
      component.reasonText.set('');
      
      component.onSave();
      
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should refuse to close the dialog window when reason text contains only whitespaces', () => {
      component.reasonText.set('     ');
      
      component.onSave();
      
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});