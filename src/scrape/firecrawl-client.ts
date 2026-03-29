import { z } from 'zod';

import type { ScrapedDocument, SourceConfig } from '../types.js';

const firecrawlResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      markdown: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

function extractEvidenceSnippets(content: string): string[] {
  const snippets = content
    .replace(/\r/g, '')
    .split(/[\n.!?]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 40)
    .slice(0, 3);

  if (snippets.length > 0) {
    return snippets;
  }

  const fallback = content.trim().slice(0, 240);
  return fallback ? [fallback] : [];
}

export async function scrapeSources(sources: SourceConfig[], apiKey: string): Promise<ScrapedDocument[]> {
  const documents: ScrapedDocument[] = [];

  for (const source of sources) {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl scrape failed for ${source.url} with HTTP ${response.status}.`);
    }

    const payload = firecrawlResponseSchema.safeParse(await response.json());
    if (!payload.success) {
      throw new Error(`Unexpected Firecrawl response format for ${source.url}.`);
    }

    if (!payload.data.success) {
      throw new Error(`Firecrawl reported failure for ${source.url}: ${payload.data.error ?? 'unknown error'}`);
    }

    const content = payload.data.data?.markdown ?? payload.data.data?.content ?? '';
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error(`Firecrawl returned empty content for ${source.url}.`);
    }

    documents.push({
      url: source.url,
      label: source.label,
      content: trimmedContent,
      evidenceSnippets: extractEvidenceSnippets(trimmedContent),
    });
  }

  return documents;
}
