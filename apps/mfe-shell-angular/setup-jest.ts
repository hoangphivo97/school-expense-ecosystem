import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { TextEncoder, TextDecoder } from 'node:util';
import { MessageChannel, MessagePort } from 'node:worker_threads';

setupZoneTestEnv();

const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  MessageChannel,
  MessagePort,
});

const { fetch, Response, Request, Headers, FormData } = require('undici');
Object.assign(globalThis, { fetch, Response, Request, Headers, FormData });