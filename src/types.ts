export interface SourceConfig {
  url: string;
  label?: string;
}

export interface SourcesConfig {
  sources: SourceConfig[];
}

export interface ScrapedDocument {
  url: string;
  label?: string;
  content: string;
  evidenceSnippets: string[];
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  frequency: number;
  evidence: string[];
  sources: string[];
}

export interface RunReport {
  runId: string;
  runDirectory: string;
  scrapedSourceCount: number;
  topProblems: Problem[];
}
