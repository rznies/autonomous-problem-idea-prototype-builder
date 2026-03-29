export interface ProblemInsight {
  id: string;
  title: string;
  summary: string;
  evidenceSnippets: string[];
  sourceUrls: string[];
}

export type IdeaComplexity = 'simple' | 'moderate';

export interface IdeaScoringHints {
  impact: number;
  effort: number;
  confidence: number;
}

export interface IdeaCandidate {
  id: string;
  problemId: string;
  name: string;
  description: string;
  coreValuePath: string;
  complexity: IdeaComplexity;
  scoringHints: IdeaScoringHints;
}

export interface IdeationResult {
  policyVersion: 'ideation-v1';
  items: Array<{
    problem: ProblemInsight;
    ideas: IdeaCandidate[];
  }>;
}

export interface ScoreBreakdown {
  impact: number;
  effort: number;
  confidence: number;
  effortBonus: number;
  total: number;
}

export interface EvaluatedIdea {
  idea: IdeaCandidate;
  score: ScoreBreakdown;
}

export interface SelectionRationale {
  policyVersion: 'selection-v1';
  weights: {
    impact: number;
    effortBonus: number;
    confidence: number;
  };
  selectedIdeaId: string;
  selectedScore: ScoreBreakdown;
  explanation: string;
}

export interface SelectionResult {
  selected: IdeaCandidate;
  evaluated: EvaluatedIdea[];
  rationale: SelectionRationale;
}

export type PrototypeStack = 'node-html' | 'vite-typescript';

export interface ScaffoldFile {
  path: string;
  contents: string;
}

export interface PrototypeScaffold {
  policyVersion: 'scaffold-v1';
  stack: PrototypeStack;
  files: ScaffoldFile[];
  runCommand: string;
  smokeCommand: string;
}

export interface IdeaToPrototypeResult {
  ideation: IdeationResult;
  selection: SelectionResult;
  scaffold: PrototypeScaffold;
}
