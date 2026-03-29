import type { Problem, ScrapedDocument } from '../types.js';

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'have',
  'i',
  'in',
  'is',
  'it',
  'my',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'too',
  'was',
  'we',
  'with',
  'you',
  'your',
]);

const COMPLAINT_MARKERS = [
  'annoy',
  'bad',
  'broken',
  'bug',
  "can't",
  'cannot',
  'crash',
  'difficult',
  'error',
  'fail',
  'frustrat',
  'hard',
  'hate',
  'issue',
  'problem',
  'slow',
  'stuck',
  'wish',
];

interface Candidate {
  sentence: string;
  sourceUrl: string;
}

interface Aggregate {
  key: string;
  titleTokens: string[];
  frequency: number;
  evidence: string[];
  sources: Set<string>;
}

function normalizeToken(token: string): string {
  const lowered = token.toLowerCase();
  if (lowered.endsWith('ing') && lowered.length > 5) {
    return lowered.slice(0, -3);
  }
  if (lowered.endsWith('ed') && lowered.length > 4) {
    return lowered.slice(0, -2);
  }
  if (lowered.endsWith('s') && lowered.length > 3) {
    return lowered.slice(0, -1);
  }
  return lowered;
}

function tokenizeForKey(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .map((token) => normalizeToken(token.trim()))
    .filter((token) => token.length >= 3)
    .filter((token) => !STOPWORDS.has(token));
}

function splitIntoSentences(content: string): string[] {
  return content
    .replace(/\r/g, '')
    .split(/[\n.!?]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 25);
}

function isComplaintSentence(sentence: string): boolean {
  const lowered = sentence.toLowerCase();
  return COMPLAINT_MARKERS.some((marker) => lowered.includes(marker));
}

function sentenceKey(sentence: string): { key: string; titleTokens: string[] } | null {
  const tokens = tokenizeForKey(sentence);
  if (tokens.length < 3) {
    return null;
  }

  const frequencyByToken = new Map<string, number>();
  for (const token of tokens) {
    frequencyByToken.set(token, (frequencyByToken.get(token) ?? 0) + 1);
  }

  const topTokens = [...frequencyByToken.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 5)
    .map(([token]) => token);

  if (topTokens.length < 3) {
    return null;
  }

  const key = [...topTokens].sort((a, b) => a.localeCompare(b)).join('|');
  return { key, titleTokens: topTokens };
}

function sentenceCandidates(documents: ScrapedDocument[]): Candidate[] {
  const complaintCandidates: Candidate[] = [];
  const fallbackCandidates: Candidate[] = [];

  for (const document of documents) {
    const sentences = splitIntoSentences(document.content);
    for (const sentence of sentences) {
      const candidate = { sentence, sourceUrl: document.url };
      if (isComplaintSentence(sentence)) {
        complaintCandidates.push(candidate);
      }
      fallbackCandidates.push(candidate);
    }
  }

  if (complaintCandidates.length >= 5) {
    return complaintCandidates;
  }

  return [...complaintCandidates, ...fallbackCandidates];
}

function formatTitle(tokens: string[]): string {
  return tokens
    .slice(0, 4)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function fallbackProblem(index: number, fallbackSource: string | undefined): Problem {
  return {
    id: `problem-${index + 1}`,
    title: `Unclassified Problem ${index + 1}`,
    description: 'Insufficient complaint signal in source data for richer extraction.',
    frequency: 1,
    evidence: ['Insufficient complaint signal in source data for richer extraction.'],
    sources: fallbackSource ? [fallbackSource] : [],
  };
}

export function extractTopProblems(documents: ScrapedDocument[], limit = 5): Problem[] {
  if (limit <= 0) {
    return [];
  }

  const aggregates = new Map<string, Aggregate>();

  for (const candidate of sentenceCandidates(documents)) {
    const keyResult = sentenceKey(candidate.sentence);
    if (!keyResult) {
      continue;
    }

    const existing = aggregates.get(keyResult.key);
    if (!existing) {
      aggregates.set(keyResult.key, {
        key: keyResult.key,
        titleTokens: keyResult.titleTokens,
        frequency: 1,
        evidence: [candidate.sentence],
        sources: new Set([candidate.sourceUrl]),
      });
      continue;
    }

    existing.frequency += 1;
    existing.sources.add(candidate.sourceUrl);
    if (existing.evidence.length < 3 && !existing.evidence.includes(candidate.sentence)) {
      existing.evidence.push(candidate.sentence);
    }
  }

  const sorted = [...aggregates.values()]
    .sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.key.localeCompare(b.key);
    })
    .slice(0, limit)
    .map((aggregate, index) => ({
      id: `problem-${index + 1}`,
      title: formatTitle(aggregate.titleTokens),
      description: `Users repeatedly report pain around: ${formatTitle(aggregate.titleTokens).toLowerCase()}.`,
      frequency: aggregate.frequency,
      evidence: aggregate.evidence,
      sources: [...aggregate.sources].sort((a, b) => a.localeCompare(b)),
    }));

  const fallbackSource = documents[0]?.url;

  while (sorted.length < limit) {
    sorted.push(fallbackProblem(sorted.length, fallbackSource));
  }

  return sorted;
}
