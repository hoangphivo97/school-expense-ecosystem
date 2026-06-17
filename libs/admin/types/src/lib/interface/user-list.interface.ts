import { FilterParams, PaginationParams } from '@school-expense-ecosystem/shared/types';

/**
 * Strictly-typed business filters extracted directly from the global filter matrix.
 * Every field is contextually optional because the Admin can clear filters to view all users.
 */
export interface UserFilters extends Pick<FilterParams, 'searchTerm' | 'role' | 'status' | 'userType' | 'facultyId'> {}

/**
 * Unified Flat User Query Payload Contract.
 * Composes pristine business criteria with strict technical pagination tokens.
 * Completely eliminates loose parameter code smells in the service layer.
 */
export interface UserQueryPayload extends UserFilters, PaginationParams {}