import 'dotenv/config';

import { runOnce } from './pipeline/run-once.js';

async function main(): Promise<void> {
  const result = await runOnce();

  console.log(`Run ID: ${result.runId}`);
  console.log(`Artifacts: ${result.runDirectory}`);
  console.log(`Scraped sources: ${result.scrapedSourceCount}`);
  console.log(`Top problems: ${result.topProblems.length}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Run failed: ${message}`);
  process.exitCode = 1;
});
