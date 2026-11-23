import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Re-expose Node.js Web APIs stripped by jsdom (required by undici / @firebase/auth)
const { TextEncoder, TextDecoder } = require('node:util');
const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
const { MessageChannel, MessagePort } = require('node:worker_threads');

Object.assign(globalThis, {
  TextEncoder: globalThis.TextEncoder ?? TextEncoder,
  TextDecoder: globalThis.TextDecoder ?? TextDecoder,
  ReadableStream: globalThis.ReadableStream ?? ReadableStream,
  WritableStream: globalThis.WritableStream ?? WritableStream,
  TransformStream: globalThis.TransformStream ?? TransformStream,
  MessageChannel: globalThis.MessageChannel ?? MessageChannel,
  MessagePort: globalThis.MessagePort ?? MessagePort,
});

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    readonly ok = true;
    readonly status = 200;
    readonly statusText = 'OK';
    readonly headers = new Map();

    constructor(private readonly body?: unknown) {}

    async json(): Promise<unknown> {
      return typeof this.body === 'string' ? JSON.parse(this.body) : (this.body ?? {});
    }

    async text(): Promise<string> {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body ?? '');
    }
  } as unknown as typeof Response;
}

if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {} as unknown as typeof Request;
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = Map as unknown as typeof Headers;
}

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = (async () => new globalThis.Response()) as unknown as typeof fetch;
}