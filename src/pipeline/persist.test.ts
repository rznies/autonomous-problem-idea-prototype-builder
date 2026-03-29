import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import type { IdeaToPrototypeResult } from './contracts.js';
import { persistIdeaToPrototypeArtifacts } from './persist.js';

const fixture: IdeaToPrototypeResult = {
  ideation: {
    policyVersion: 'ideation-v1',
    items: [
      {
        problem: {
          id: 'p1',
          title: 'Problem',
          summary: 'Summary',
          evidenceSnippets: ['snippet'],
          sourceUrls: ['https://example.com'],
        },
        ideas: [
          {
            id: 'p1-quick-intake',
            problemId: 'p1',
            name: 'Idea',
            description: 'Desc',
            coreValuePath: 'Path',
            complexity: 'simple',
            scoringHints: { impact: 4, effort: 2, confidence: 4 },
          },
        ],
      },
    ],
  },
  selection: {
    selected: {
      id: 'p1-quick-intake',
      problemId: 'p1',
      name: 'Idea',
      description: 'Desc',
      coreValuePath: 'Path',
      complexity: 'simple',
      scoringHints: { impact: 4, effort: 2, confidence: 4 },
    },
    evaluated: [
      {
        idea: {
          id: 'p1-quick-intake',
          problemId: 'p1',
          name: 'Idea',
          description: 'Desc',
          coreValuePath: 'Path',
          complexity: 'simple',
          scoringHints: { impact: 4, effort: 2, confidence: 4 },
        },
        score: {
          impact: 12,
          effort: 2,
          confidence: 8,
          effortBonus: 8,
          total: 28,
        },
      },
    ],
    rationale: {
      policyVersion: 'selection-v1',
      weights: {
        impact: 3,
        effortBonus: 2,
        confidence: 2,
      },
      selectedIdeaId: 'p1-quick-intake',
      selectedScore: {
        impact: 12,
        effort: 2,
        confidence: 8,
        effortBonus: 8,
        total: 28,
      },
      explanation: 'deterministic',
    },
  },
  scaffold: {
    policyVersion: 'scaffold-v1',
    stack: 'node-html',
    files: [{ path: 'index.html', contents: '<html></html>' }],
    runCommand: 'npm run start',
    smokeCommand: 'npm run smoke',
  },
};

test('persistIdeaToPrototypeArtifacts writes deterministic stage artifact files', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'idea-prototype-'));

  try {
    const persisted = await persistIdeaToPrototypeArtifacts(fixture, tempDir);

    const ideationRaw = await readFile(persisted.ideationPath, 'utf8');
    const selectionRaw = await readFile(persisted.selectionPath, 'utf8');
    const scaffoldRaw = await readFile(persisted.scaffoldPath, 'utf8');

    assert.equal(JSON.parse(ideationRaw).policyVersion, 'ideation-v1');
    assert.equal(JSON.parse(selectionRaw).rationale.policyVersion, 'selection-v1');
    assert.equal(JSON.parse(scaffoldRaw).policyVersion, 'scaffold-v1');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
