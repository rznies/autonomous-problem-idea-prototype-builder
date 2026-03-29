import assert from 'node:assert/strict';
import test from 'node:test';

import type { IdeationResult } from './contracts.js';
import { selectIdea } from './selection.js';

const ideationFixture: IdeationResult = {
  policyVersion: 'ideation-v1',
  items: [
    {
      problem: {
        id: 'p1',
        title: 'Problem A',
        summary: 'A',
        evidenceSnippets: ['a'],
        sourceUrls: ['https://example.com/a'],
      },
      ideas: [
        {
          id: 'p1-a',
          problemId: 'p1',
          name: 'Idea A',
          description: 'A',
          coreValuePath: 'A',
          complexity: 'simple',
          scoringHints: { impact: 4, effort: 3, confidence: 4 },
        },
        {
          id: 'p1-b',
          problemId: 'p1',
          name: 'Idea B',
          description: 'B',
          coreValuePath: 'B',
          complexity: 'moderate',
          scoringHints: { impact: 5, effort: 4, confidence: 3 },
        },
      ],
    },
    {
      problem: {
        id: 'p2',
        title: 'Problem B',
        summary: 'B',
        evidenceSnippets: ['b'],
        sourceUrls: ['https://example.com/b'],
      },
      ideas: [
        {
          id: 'p2-a',
          problemId: 'p2',
          name: 'Idea C',
          description: 'C',
          coreValuePath: 'C',
          complexity: 'simple',
          scoringHints: { impact: 5, effort: 2, confidence: 5 },
        },
      ],
    },
  ],
};

test('selectIdea is deterministic and persists explicit scoring rationale', () => {
  const first = selectIdea(ideationFixture);
  const second = selectIdea(ideationFixture);

  assert.equal(first.selected.id, 'p2-a');
  assert.equal(second.selected.id, 'p2-a');
  assert.deepEqual(first.rationale, second.rationale);
  assert.equal(first.rationale.policyVersion, 'selection-v1');
  assert.deepEqual(first.rationale.weights, { impact: 3, effortBonus: 2, confidence: 2 });
  assert.ok(first.rationale.explanation.includes('highest total score'));
  assert.equal(first.rationale.selectedIdeaId, first.selected.id);
});

test('selectIdea uses stable tie-breaker on idea id', () => {
  const tied: IdeationResult = {
    policyVersion: 'ideation-v1',
    items: [
      {
        problem: {
          id: 'p3',
          title: 'Tie',
          summary: 'Tie',
          evidenceSnippets: ['tie'],
          sourceUrls: ['https://example.com/tie'],
        },
        ideas: [
          {
            id: 'p3-b',
            problemId: 'p3',
            name: 'Later',
            description: 'Later',
            coreValuePath: 'Later',
            complexity: 'simple',
            scoringHints: { impact: 4, effort: 3, confidence: 3 },
          },
          {
            id: 'p3-a',
            problemId: 'p3',
            name: 'Earlier',
            description: 'Earlier',
            coreValuePath: 'Earlier',
            complexity: 'simple',
            scoringHints: { impact: 4, effort: 3, confidence: 3 },
          },
        ],
      },
    ],
  };

  const result = selectIdea(tied);
  assert.equal(result.selected.id, 'p3-a');
});
