import { TestBed } from '@angular/core/testing';

import { AuthSignalStore } from './auth-signal.store';

describe('AuthSignalStore', () => {
  let service: AuthSignalStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthSignalStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
