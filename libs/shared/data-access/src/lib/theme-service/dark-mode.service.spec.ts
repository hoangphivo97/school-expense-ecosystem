import { TestBed } from '@angular/core/testing';
import { expect, describe, it, beforeEach } from '@jest/globals';
import {DarkModeService} from './dark-mode.service';

describe('Theme', () => {
  let service: DarkModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DarkModeService);
  });

  it('should be created', () => {
    // Assert that the service instantiates correctly to clear empty function and unused var rule violations
    expect(service).toBeTruthy();
  });
});