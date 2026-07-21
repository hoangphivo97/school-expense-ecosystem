import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

if (!globalThis.fetch) {
  globalThis.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as any));
}

if (!globalThis.Response) {
  globalThis.Response = class {} as any;
}