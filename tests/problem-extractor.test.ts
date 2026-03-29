import test from 'node:test';
import assert from 'node:assert/strict';

import { extractTopProblems } from '../src/extract/problem-extractor.js';
import type { ScrapedDocument } from '../src/types.js';

const docs: ScrapedDocument[] = [
  {
    url: 'https://example.com/reddit-thread',
    label: 'reddit',
    content:
      'The onboarding flow is broken and confusing. I hate how onboarding setup fails every time. Onboarding setup error keeps blocking my team and this issue is frustrating.',
    evidenceSnippets: [],
  },
  {
    url: 'https://example.com/review-board',
    label: 'reviews',
    content:
      'Search results are slow and inaccurate. We have a problem where search returns bad matches and users get stuck. Search performance issue is frustrating for everyone.',
    evidenceSnippets: [],
  },
  {
    url: 'https://example.com/forum',
    label: 'forum',
    content:
      'Billing page crashes on submit and payment confirmation fails. Billing crash issue is a big problem and causes repeated errors. I wish billing was reliable.',
    evidenceSnippets: [],
  },
];

test('returns exactly 5 deduped problems with evidence and sources', () => {
  const topProblems = extractTopProblems(docs, 5);

  assert.equal(topProblems.length, 5);

  const idSet = new Set(topProblems.map((problem) => problem.id));
  assert.equal(idSet.size, topProblems.length);

  for (const problem of topProblems) {
    assert.equal(problem.evidence.length > 0, true);
    assert.equal(problem.sources.length > 0, true);
    assert.equal(problem.frequency >= 1, true);
  }
});
