import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { loadSourcesConfig } from '../src/config/load-sources-config.js';

async function writeTempConfig(contents: string): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sources-config-test-'));
  const filePath = path.join(tempDir, 'sources.json');
  await writeFile(filePath, contents, 'utf8');
  return filePath;
}

test('loads valid config and normalizes URLs', async () => {
  const filePath = await writeTempConfig(
    JSON.stringify({
      sources: [
        { url: 'https://example.com/reviews/' },
        { url: 'https://example.org/path?q=1', label: 'Org source' },
      ],
    }),
  );

  const config = await loadSourcesConfig(filePath);

  assert.equal(config.sources.length, 2);
  assert.equal(config.sources[0]?.url, 'https://example.com/reviews');
  assert.equal(config.sources[1]?.url, 'https://example.org/path?q=1');
  assert.equal(config.sources[1]?.label, 'Org source');
});

test('fails on invalid URL', async () => {
  const filePath = await writeTempConfig(JSON.stringify({ sources: [{ url: 'not-a-url' }] }));

  await assert.rejects(loadSourcesConfig(filePath), /Invalid sources config/);
});

test('fails on duplicate URL after normalization', async () => {
  const filePath = await writeTempConfig(
    JSON.stringify({
      sources: [{ url: 'https://example.com/path/' }, { url: 'https://example.com/path' }],
    }),
  );

  await assert.rejects(loadSourcesConfig(filePath), /Duplicate source URL/);
});
