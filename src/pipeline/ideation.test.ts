import assert from 'node:assert/strict';
import test from 'node:test';

import type { ProblemInsight } from './contracts.js';
import { generateIdeas } from './ideation.js';

const problems: ProblemInsight[] = [
  {
    id: 'p1',
    title: 'Slow onboarding',
    summary: 'New users take too long to finish setup.',
    evidenceSnippets: ['setup was confusing', 'too many initial questions'],
    sourceUrls: ['https://example.com/a', 'https://example.com/b'],
  },
  {
    id: 'p2',
    title: 'Missing urgency prompts',
    summary: 'Users postpone action because critical reminders are weak.',
    evidenceSnippets: ['I forgot to return', 'would help to nudge me'],
    sourceUrls: ['https://example.com/c'],
  },
  {
    id: 'p3',
    title: 'Sparse evidence case',
    summary: 'Single-source complaint with one clear friction point.',
    evidenceSnippets: ['single report'],
    sourceUrls: ['https://example.com/d'],
  },
];

test('generateIdeas returns 2-3 ideas per problem with stable contract fields', () => {
  const result = generateIdeas(problems);

  assert.equal(result.policyVersion, 'ideation-v1');
  assert.equal(result.items.length, 3);

  const [first, second, third] = result.items;
  assert.equal(first.ideas.length, 3);
  assert.equal(second.ideas.length, 3);
  assert.equal(third.ideas.length, 2);

  for (const item of result.items) {
    for (const idea of item.ideas) {
      assert.equal(idea.problemId, item.problem.id);
      assert.ok(idea.id.startsWith(`${item.problem.id}-`));
      assert.ok(idea.name.length > 0);
      assert.ok(idea.description.length > 0);
      assert.ok(idea.coreValuePath.length > 0);
      assert.ok(idea.scoringHints.impact >= 1 && idea.scoringHints.impact <= 5);
      assert.ok(idea.scoringHints.effort >= 1 && idea.scoringHints.effort <= 5);
      assert.ok(idea.scoringHints.confidence >= 1 && idea.scoringHints.confidence <= 5);
    }
  }
});

test('generateIdeas deterministically boosts impact for urgent problems', () => {
  const result = generateIdeas([problems[1]]);
  const firstIdea = result.items[0].ideas[0];

  assert.equal(firstIdea.scoringHints.impact, 5);
});
