import path from 'node:path';

import { loadSourcesConfig } from '../config/load-sources-config.js';
import { extractTopProblems } from '../extract/problem-extractor.js';
import { createRunId } from '../run/run-id.js';
import { scrapeSources } from '../scrape/firecrawl-client.js';
import type { RunReport } from '../types.js';
import { writeJsonFile } from '../utils/fs-utils.js';

interface RunOnceOptions {
  configPath?: string;
  runsDir?: string;
  now?: Date;
}

export async function runOnce(options: RunOnceOptions = {}): Promise<RunReport> {
  const configPath = options.configPath ?? path.resolve('config', 'sources.json');
  const runsDir = options.runsDir ?? path.resolve('runs');

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlApiKey) {
    throw new Error('Missing FIRECRAWL_API_KEY in environment.');
  }

  const sourcesConfig = await loadSourcesConfig(configPath);
  const scrapedDocuments = await scrapeSources(sourcesConfig.sources, firecrawlApiKey);
  const topProblems = extractTopProblems(scrapedDocuments, 5);

  const runId = createRunId(options.now);
  const runDirectory = path.join(runsDir, runId);

  await writeJsonFile(path.join(runDirectory, 'config.json'), sourcesConfig);
  await writeJsonFile(path.join(runDirectory, 'scrape.json'), {
    sourceCount: scrapedDocuments.length,
    documents: scrapedDocuments,
  });
  await writeJsonFile(path.join(runDirectory, 'extract.json'), {
    problemCount: topProblems.length,
    problems: topProblems,
  });
  await writeJsonFile(path.join(runDirectory, 'report.json'), {
    runId,
    status: 'success',
    stage: 'extract',
    scrapedSourceCount: scrapedDocuments.length,
    topProblemCount: topProblems.length,
  });

  return {
    runId,
    runDirectory,
    scrapedSourceCount: scrapedDocuments.length,
    topProblems,
  };
}
