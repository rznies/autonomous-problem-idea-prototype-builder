export type PrototypeStack = 'node-html' | 'vite-ts';

export type StageStatus = 'started' | 'passed' | 'failed' | 'skipped';

export type FinalRunStatus = 'success' | 'failed';

export interface CommandSpec {
  readonly cmd: string;
  readonly args?: readonly string[];
}

export interface CommandResult {
  readonly command: CommandSpec;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ExecutionAttempt {
  readonly label: string;
  readonly workspacePath: string;
  readonly stack: PrototypeStack;
  readonly sandboxMemoryMb: number;
  readonly commands: readonly CommandSpec[];
}

export interface ExecutionAttemptResult {
  readonly ok: boolean;
  readonly commandResults: readonly CommandResult[];
  readonly summary: string;
}

export interface DaytonaExecutionAdapter {
  runAttempt(attempt: ExecutionAttempt): Promise<ExecutionAttemptResult>;
}

export interface SmokeCheck {
  readonly id: string;
  readonly command: CommandSpec;
  readonly allowedExitCodes?: readonly number[];
}

export interface SmokeCheckResult {
  readonly id: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly passed: boolean;
}

export interface StageTimelineEntry {
  readonly stage: string;
  readonly status: StageStatus;
  readonly at: string;
  readonly detail: string;
}

export interface BlockerLog {
  readonly attemptLabel: string;
  readonly reason: string;
  readonly command: string;
  readonly stderr: string;
}

export interface RunReport {
  readonly runId: string;
  readonly stack: PrototypeStack;
  readonly finalStatus: FinalRunStatus;
  readonly retryCount: number;
  readonly attemptsExecuted: number;
  readonly blockerLogs: readonly BlockerLog[];
  readonly timeline: readonly StageTimelineEntry[];
}

export interface RunExecutionInput {
  readonly runId: string;
  readonly workspacePath: string;
  readonly stack: PrototypeStack;
  readonly baseCommands: readonly CommandSpec[];
  readonly smokeChecks: readonly SmokeCheck[];
}

export interface AutoFixPlanner {
  createFixCommands(context: {
    readonly retryNumber: number;
    readonly latestCommandResults: readonly CommandResult[];
    readonly latestSmokeResults: readonly SmokeCheckResult[];
  }): readonly CommandSpec[];
}

export interface CommandRunner {
  run(command: CommandSpec): Promise<{
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
  }>;
}
