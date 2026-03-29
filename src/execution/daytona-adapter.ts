import type {
  DaytonaExecutionAdapter,
  ExecutionAttempt,
  ExecutionAttemptResult,
} from './contracts.js';

export class UnavailableDaytonaExecutionAdapter implements DaytonaExecutionAdapter {
  async runAttempt(attempt: ExecutionAttempt): Promise<ExecutionAttemptResult> {
    throw new Error(
      `Daytona execution is unavailable in this environment. Attempt '${attempt.label}' could not run.`,
    );
  }
}
