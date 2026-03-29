import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { IdeaToPrototypeResult } from './contracts.js';

export interface PersistedStageArtifacts {
  ideationPath: string;
  selectionPath: string;
  scaffoldPath: string;
}

export async function persistIdeaToPrototypeArtifacts(
  result: IdeaToPrototypeResult,
  outputDir: string,
): Promise<PersistedStageArtifacts> {
  await mkdir(outputDir, { recursive: true });

  const ideationPath = path.join(outputDir, 'ideation.json');
  const selectionPath = path.join(outputDir, 'selection.json');
  const scaffoldPath = path.join(outputDir, 'scaffold.json');

  await writeFile(ideationPath, JSON.stringify(result.ideation, null, 2));
  await writeFile(
    selectionPath,
    JSON.stringify(
      {
        selected: result.selection.selected,
        evaluated: result.selection.evaluated,
        rationale: result.selection.rationale,
      },
      null,
      2,
    ),
  );
  await writeFile(scaffoldPath, JSON.stringify(result.scaffold, null, 2));

  return {
    ideationPath,
    selectionPath,
    scaffoldPath,
  };
}
