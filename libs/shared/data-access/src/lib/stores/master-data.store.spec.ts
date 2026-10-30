import { MasterDataStore } from './master-data.store';
import { FacultyApiService } from '../faculty-service/faculty-api.service';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { FacultyId } from '@school-expense-ecosystem/shared/types';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

describe('MasterDataStore', () => {
  let store: MasterDataStore;

  // Mock signals đại diện cho httpResource từ FacultyApiService
  const mockFacultiesSignal = signal<any[]>([]);
  const mockIsLoadingSignal = signal<boolean>(false);

  const mockFacultyApiService = {
    facultiesResource: {
      value: mockFacultiesSignal,
      isLoading: mockIsLoadingSignal,
      reload: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        MasterDataStore,
        { provide: FacultyApiService, useValue: mockFacultyApiService },
      ],
    });

    store = TestBed.inject(MasterDataStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize with default ALL option when raw faculties array is empty', () => {
    mockFacultiesSignal.set([]);

    const options = store.facultyOptions();

    expect(options.length).toBe(1);
    expect(options[0]).toEqual({
      value: 'ALL',
      labelKey: 'shared.filter.options.faculties.ALL',
    });
  });

  it('should correctly compute facultyOptions with ALL option and dynamic faculty mappings', () => {
    const rawData = [
      { id: FacultyId.FIT, name: 'Faculty of Information Technology' },
      { id: FacultyId.FBE, name: 'Faculty of Business and Economics' },
    ];
    mockFacultiesSignal.set(rawData);

    const options = store.facultyOptions();

    expect(options.length).toBe(3);
    expect(options[0].value).toBe('ALL');
    expect(options[1]).toEqual({
      value: FacultyId.FIT,
      labelKey: `shared.filter.options.faculties.${FacultyId.FIT}`,
      label: 'Faculty of Information Technology',
    });
    expect(options[2]).toEqual({
      value: FacultyId.FBE,
      labelKey: `shared.filter.options.faculties.${FacultyId.FBE}`,
      label: 'Faculty of Business and Economics',
    });
  });

  it('should reflect isLoading state from FacultyApiService', () => {
    mockIsLoadingSignal.set(true);
    expect(store.isLoading()).toBe(true);

    mockIsLoadingSignal.set(false);
    expect(store.isLoading()).toBe(false);
  });

  it('should delegate reloadFaculties call to FacultyApiService', () => {
    store.reloadFaculties();
    expect(mockFacultyApiService.facultiesResource.reload).toHaveBeenCalledTimes(1);
  });
});