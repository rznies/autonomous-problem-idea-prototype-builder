import assert from 'node:assert/strict';
import test from 'node:test';

import type { IdeaCandidate } from './contracts.js';
import { scaffoldPrototype } from './scaffold.js';

const simpleIdea: IdeaCandidate = {
  id: 'simple-idea',
  problemId: 'p1',
  name: 'Simple Intake',
  description: 'Simple flow',
  coreValuePath: 'Submit one form and return one recommendation.',
  complexity: 'simple',
  scoringHints: {
    impact: 4,
    effort: 2,
    confidence: 4,
  },
};

const moderateIdea: IdeaCandidate = {
  ...simpleIdea,
  id: 'moderate-idea',
  name: 'Moderate Interactive Hub',
  complexity: 'moderate',
};

test('scaffoldPrototype routes simple ideas to node-html policy output', () => {
  const scaffold = scaffoldPrototype(simpleIdea);

  assert.equal(scaffold.policyVersion, 'scaffold-v1');
  assert.equal(scaffold.stack, 'node-html');
  assert.equal(scaffold.runCommand, 'npm run start');
  assert.equal(scaffold.smokeCommand, 'npm run smoke');
  assert.ok(scaffold.files.some((file) => file.path === 'index.html'));
  assert.ok(scaffold.files.some((file) => file.path === 'package.json'));
});

test('scaffoldPrototype routes moderate ideas to vite-typescript policy output', () => {
  const scaffold = scaffoldPrototype(moderateIdea);

  assert.equal(scaffold.stack, 'vite-typescript');
  assert.equal(scaffold.runCommand, 'npm run dev');
  assert.equal(scaffold.smokeCommand, 'npm run smoke');
  assert.ok(scaffold.files.some((file) => file.path === 'src/main.ts'));
  assert.ok(scaffold.files.some((file) => file.path === 'tsconfig.json'));
});
