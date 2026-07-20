import 'jest-preset-angular/setup-jest';

// Polyfill global fetch engine to intercept Firebase Auth platform invocation
if (!globalThis.fetch) {
  globalThis.fetch = jest.fn(() => Promise.resolve(new Response()));
}