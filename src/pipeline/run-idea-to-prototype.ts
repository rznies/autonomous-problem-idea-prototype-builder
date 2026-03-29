import type { IdeaToPrototypeResult, ProblemInsight } from './contracts.js';
import { generateIdeas } from './ideation.js';
import { scaffoldPrototype } from './scaffold.js';
import { selectIdea } from './selection.js';

export function runIdeaToPrototypeStages(problems: ProblemInsight[]): IdeaToPrototypeResult {
  const ideation = generateIdeas(problems);
  const selection = selectIdea(ideation);
  const scaffold = scaffoldPrototype(selection.selected);

  return {
    ideation,
    selection,
    scaffold,
  };
}
