import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProblemInsight } from './contracts.js';
import { runIdeaToPrototypeStages } from './run-idea-to-prototype.js';

const problems: ProblemInsight[] = [
  {
    id: 'problem-onboarding',
    title: 'Urgent onboarding drop-off',
    summary: 'Critical first-run confusion causes churn.',
    evidenceSnippets: ['cannot find first action', 'left app during setup'],
    sourceUrls: ['https://example.com/onboarding', 'https://example.com/onboarding-2'],
  },
  {
    id: 'problem-reminders',
    title: 'Weak reminder system',
    summary: 'Users miss follow-up actions.',
    evidenceSnippets: ['forgot to return'],
    sourceUrls: ['https://example.com/reminders'],
  },
];

test('runIdeaToPrototypeStages composes ideation -> selection -> scaffold deterministically', () => {
  const first = runIdeaToPrototypeStages(problems);
  const second = runIdeaToPrototypeStages(problems);

  assert.equal(first.ideation.policyVersion, 'ideation-v1');
  assert.equal(first.selection.rationale.policyVersion, 'selection-v1');
  assert.equal(first.scaffold.policyVersion, 'scaffold-v1');
  assert.equal(first.selection.selected.id, second.selection.selected.id);
  assert.deepEqual(first.selection.rationale, second.selection.rationale);
  assert.ok(first.scaffold.files.length > 0);
});
