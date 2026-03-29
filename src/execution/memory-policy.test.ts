import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getSandboxMemoryMb } from './memory-policy.js';

test('assigns 2GB memory to node-html stack', () => {
  assert.equal(getSandboxMemoryMb('node-html'), 2048);
});

test('assigns 4GB memory to vite-ts stack', () => {
  assert.equal(getSandboxMemoryMb('vite-ts'), 4096);
});
