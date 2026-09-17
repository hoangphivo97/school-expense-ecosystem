import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Polyfill global fetch for JSDOM
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Decouple Firebase infrastructure from UI unit tests
jest.mock('@angular/fire/firestore', () => ({
  doc: jest.fn(),
  Firestore: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('@angular/fire/auth', () => ({
  Auth: jest.fn(),
}));