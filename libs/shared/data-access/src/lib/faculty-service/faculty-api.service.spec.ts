import { TestBed } from '@angular/core/testing';
import { FacultyApiService } from './faculty-api.service';
import { API_BASE_URL } from '@school-expense-ecosystem/shared/tokens';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';

describe('FacultyApiService', () => {
  let service: FacultyApiService;
  let httpMock: HttpTestingController;

  const mockBaseUrl = 'http://localhost:3000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FacultyApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: mockBaseUrl },
      ],
    });

    service = TestBed.inject(FacultyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch department fund balance with correct query parameters', () => {
    const mockFacultyId: any = 'FIT';
    const mockYear = 2026;
    const mockResponse: any = { facultyId: 'FIT', balance: 500000 };

    service.getDepartmentFundBalance(mockFacultyId, mockYear).subscribe((data) => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${mockBaseUrl}/api/faculties/FIT/fund-balance?year=2026`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});