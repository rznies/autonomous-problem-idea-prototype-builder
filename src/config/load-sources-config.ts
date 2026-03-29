import { readFile } from 'node:fs/promises';
import { z } from 'zod';

import type { SourceConfig, SourcesConfig } from '../types.js';

const urlSchema = z.url();

const sourceConfigSchema = z.object({
  url: urlSchema,
  label: z.string().trim().min(1).optional(),
});

const sourcesConfigSchema = z
  .object({
    sources: z.array(sourceConfigSchema).min(1, 'config/sources.json must contain at least one source URL.'),
  })
  .strict();

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  const normalizedPath = parsed.pathname.endsWith('/') && parsed.pathname !== '/' ? parsed.pathname.slice(0, -1) : parsed.pathname;
  const normalized = `${parsed.origin}${normalizedPath}${parsed.search}${parsed.hash}`;
  return normalized;
}

export async function loadSourcesConfig(filePath: string): Promise<SourcesConfig> {
  const raw = await readFile(filePath, 'utf8');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${filePath}.`);
  }

  const parsed = sourcesConfigSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; ');
    throw new Error(`Invalid sources config at ${filePath}: ${details}`);
  }

  const dedupeSet = new Set<string>();
  const validatedSources: SourceConfig[] = [];

  for (const source of parsed.data.sources) {
    const normalizedUrl = normalizeUrl(source.url);
    if (dedupeSet.has(normalizedUrl)) {
      throw new Error(`Duplicate source URL in ${filePath}: ${normalizedUrl}`);
    }

    dedupeSet.add(normalizedUrl);
    validatedSources.push({
      ...source,
      url: normalizedUrl,
    });
  }

  return { sources: validatedSources };
}
