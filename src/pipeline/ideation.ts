import type { IdeaCandidate, IdeaComplexity, IdeationResult, ProblemInsight } from './contracts.js';

const IDEA_TEMPLATES: Array<{
  suffix: string;
  complexity: IdeaComplexity;
  coreValuePath: string;
  baseHints: {
    impact: number;
    effort: number;
    confidence: number;
  };
  description: (problem: ProblemInsight) => string;
}> = [
  {
    suffix: 'quick-intake',
    complexity: 'simple',
    coreValuePath: 'Capture one problem report and return one actionable next step.',
    baseHints: { impact: 4, effort: 2, confidence: 4 },
    description: (problem) =>
      `Single-page intake flow for "${problem.title}" with immediate recommended action output.`,
  },
  {
    suffix: 'guided-workflow',
    complexity: 'simple',
    coreValuePath: 'Collect constraints, then generate a prioritized checklist.',
    baseHints: { impact: 4, effort: 3, confidence: 3 },
    description: (problem) =>
      `Guided checklist builder that turns "${problem.summary}" into a short, ordered execution plan.`,
  },
  {
    suffix: 'interaction-hub',
    complexity: 'moderate',
    coreValuePath: 'Track item state transitions with immediate visual feedback.',
    baseHints: { impact: 5, effort: 4, confidence: 3 },
    description: (problem) =>
      `Interactive prototype for "${problem.title}" with stateful actions and compact status panels.`,
  },
];

function clampHint(value: number): number {
  if (value < 1) {
    return 1;
  }

  if (value > 5) {
    return 5;
  }

  return value;
}

function inferIdeaCount(problem: ProblemInsight): 2 | 3 {
  return problem.evidenceSnippets.length >= 2 ? 3 : 2;
}

function scoreAdjustments(problem: ProblemInsight): { impact: number; confidence: number } {
  const text = `${problem.title} ${problem.summary}`.toLowerCase();
  const impact = text.includes('urgent') || text.includes('critical') ? 1 : 0;
  const confidence = problem.sourceUrls.length >= 2 ? 1 : 0;
  return { impact, confidence };
}

function buildIdea(problem: ProblemInsight, index: number): IdeaCandidate {
  const template = IDEA_TEMPLATES[index];
  const adjustments = scoreAdjustments(problem);
  const baseName = `${problem.title}: ${template.suffix}`;

  return {
    id: `${problem.id}-${template.suffix}`,
    problemId: problem.id,
    name: baseName,
    description: template.description(problem),
    coreValuePath: template.coreValuePath,
    complexity: template.complexity,
    scoringHints: {
      impact: clampHint(template.baseHints.impact + adjustments.impact),
      effort: template.baseHints.effort,
      confidence: clampHint(template.baseHints.confidence + adjustments.confidence),
    },
  };
}

export function generateIdeas(problems: ProblemInsight[]): IdeationResult {
  return {
    policyVersion: 'ideation-v1',
    items: problems.map((problem) => {
      const ideaCount = inferIdeaCount(problem);
      const ideas = IDEA_TEMPLATES.slice(0, ideaCount).map((_, index) => buildIdea(problem, index));
      return { problem, ideas };
    }),
  };
}
