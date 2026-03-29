import type {
  EvaluatedIdea,
  IdeaCandidate,
  IdeationResult,
  ScoreBreakdown,
  SelectionResult,
} from './contracts.js';

const SELECTION_WEIGHTS = {
  impact: 3,
  effortBonus: 2,
  confidence: 2,
} as const;

function getEffortBonus(effort: number): number {
  return 6 - effort;
}

function scoreIdea(idea: IdeaCandidate): ScoreBreakdown {
  const effortBonus = getEffortBonus(idea.scoringHints.effort);
  const impact = idea.scoringHints.impact * SELECTION_WEIGHTS.impact;
  const confidence = idea.scoringHints.confidence * SELECTION_WEIGHTS.confidence;
  const weightedEffortBonus = effortBonus * SELECTION_WEIGHTS.effortBonus;
  const total = impact + weightedEffortBonus + confidence;

  return {
    impact,
    effort: idea.scoringHints.effort,
    confidence,
    effortBonus: weightedEffortBonus,
    total,
  };
}

function compareEvaluatedIdeas(left: EvaluatedIdea, right: EvaluatedIdea): number {
  if (right.score.total !== left.score.total) {
    return right.score.total - left.score.total;
  }

  if (right.score.impact !== left.score.impact) {
    return right.score.impact - left.score.impact;
  }

  if (right.score.confidence !== left.score.confidence) {
    return right.score.confidence - left.score.confidence;
  }

  return left.idea.id.localeCompare(right.idea.id);
}

export function selectIdea(ideation: IdeationResult): SelectionResult {
  const allIdeas = ideation.items.flatMap((item) => item.ideas);

  if (allIdeas.length === 0) {
    throw new Error('Cannot select idea: ideation result contains no candidates.');
  }

  const evaluated = allIdeas.map((idea) => ({ idea, score: scoreIdea(idea) }));
  evaluated.sort(compareEvaluatedIdeas);

  const selected = evaluated[0];
  const explanation =
    `Selected ${selected.idea.id} using policy selection-v1 because it had the highest total score (` +
    `${selected.score.total}) after weighting impact (${SELECTION_WEIGHTS.impact}x), effort bonus (` +
    `${SELECTION_WEIGHTS.effortBonus}x), and confidence (${SELECTION_WEIGHTS.confidence}x).`;

  return {
    selected: selected.idea,
    evaluated,
    rationale: {
      policyVersion: 'selection-v1',
      weights: {
        impact: SELECTION_WEIGHTS.impact,
        effortBonus: SELECTION_WEIGHTS.effortBonus,
        confidence: SELECTION_WEIGHTS.confidence,
      },
      selectedIdeaId: selected.idea.id,
      selectedScore: selected.score,
      explanation,
    },
  };
}
