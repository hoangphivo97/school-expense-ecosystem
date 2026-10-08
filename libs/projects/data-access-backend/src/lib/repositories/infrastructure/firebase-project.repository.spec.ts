import { Test, TestingModule } from '@nestjs/testing';
import { FirestoreProjectRepository } from './firebase-project.repository';
import {
  DepartmentFundNotFoundException,
  InsufficientDepartmentFundException,
} from '../../exceptions/project.exception';
import { ProjectItem } from '@school-expense-ecosystem/projects/types';
import { createMockProjectItem } from '@school-expense-ecosystem/projects/test-utils';

describe('FirestoreProjectRepository - createWithFacultyFund', () => {
  let repository: FirestoreProjectRepository;
  let mockDb: any;
  let mockTransaction: any;

  const mockProject = createMockProjectItem()
  const mockFundId = 'IT_DEPT_2026';

  beforeEach(async () => {
    mockTransaction = {
      get: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnValue({ id: 'mock-doc-ref' }),
      runTransaction: jest.fn((callback) => callback(mockTransaction)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirestoreProjectRepository,
        { provide: 'FIRESTORE_INSTANCE', useValue: mockDb },
      ],
    }).compile();

    repository = module.get<FirestoreProjectRepository>(FirestoreProjectRepository);
  });

  // Verify fund existence requirement
  it('should throw DepartmentFundNotFoundException when department fund document does not exist', async () => {
    mockTransaction.get.mockResolvedValue({ exists: false });

    await expect(repository.createWithFacultyFund(mockProject, mockFundId)).rejects.toThrow(
      DepartmentFundNotFoundException
    );

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  // Enforce balance adequacy before allowing project instantiation
  it('should throw InsufficientDepartmentFundException when remaining budget is lower than budgetCap', async () => {
    mockTransaction.get.mockResolvedValue({
      exists: true,
      data: () => ({ remainingBudget: 3000000 }), // Remaining is 3M but project requires 5M
    });

    await expect(repository.createWithFacultyFund(mockProject, mockFundId)).rejects.toThrow(
      InsufficientDepartmentFundException
    );

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  // Verify dual atomic ledger adjustments on successful transaction
  it('should atomically decrement remainingBudget, increment allocatedBudget, and persist project', async () => {
    mockTransaction.get.mockResolvedValue({
      exists: true,
      data: () => ({ remainingBudget: 50000000, allocatedBudget: 2000000 }),
    });

    const result = await repository.createWithFacultyFund(mockProject, mockFundId);

    expect(result).toEqual(mockProject);
    expect(mockTransaction.update).toHaveBeenCalledTimes(1);
    expect(mockTransaction.set).toHaveBeenCalledTimes(1);
  });
});