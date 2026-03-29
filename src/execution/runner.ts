import { getSandboxMemoryMb } from './memory-policy.js';
import { runSmokeChecks } from './smoke-checks.js';
import type {
  AutoFixPlanner,
  BlockerLog,
  CommandResult,
  CommandRunner,
  DaytonaExecutionAdapter,
  ExecutionAttempt,
  FinalRunStatus,
  RunExecutionInput,
  RunReport,
  SmokeCheckResult,
  StageStatus,
  StageTimelineEntry,
} from './contracts.js';

interface RunExecutionDeps {
  readonly daytonaAdapter: DaytonaExecutionAdapter;
  readonly commandRunner: CommandRunner;
  readonly autoFixPlanner: AutoFixPlanner;
  readonly now?: () => string;
  readonly maxFixRetries?: number;
}

function formatCommand(command: { readonly cmd: string; readonly args?: readonly string[] }): string {
  const args = command.args ?? [];
  return [command.cmd, ...args].join(' ').trim();
}

function pushStage(
  timeline: StageTimelineEntry[],
  now: () => string,
  stage: string,
  status: StageStatus,
  detail: string,
): void {
  timeline.push({
    stage,
    status,
    at: now(),
    detail,
  });
}

function toCommandBlockers(attemptLabel: string, commandResults: readonly CommandResult[]): BlockerLog[] {
  return commandResults
    .filter((result) => result.exitCode !== 0)
    .map((result) => ({
      attemptLabel,
      reason: 'command_failed',
      command: formatCommand(result.command),
      stderr: result.stderr,
    }));
}

function toSmokeBlockers(
  attemptLabel: string,
  smokeResults: readonly SmokeCheckResult[],
  checksById: ReadonlyMap<string, string>,
): BlockerLog[] {
  return smokeResults
    .filter((result) => !result.passed)
    .map((result) => ({
      attemptLabel,
      reason: 'smoke_check_failed',
      command: checksById.get(result.id) ?? result.id,
      stderr: result.stderr,
    }));
}

export async function executeRunWithAutoFix(
  input: RunExecutionInput,
  deps: RunExecutionDeps,
): Promise<RunReport> {
  const now = deps.now ?? (() => new Date().toISOString());
  const maxFixRetries = deps.maxFixRetries ?? 2;

  const checksById = new Map(input.smokeChecks.map((check) => [check.id, formatCommand(check.command)]));
  const timeline: StageTimelineEntry[] = [];
  const blockerLogs: BlockerLog[] = [];

  let retryCount = 0;
  let attemptsExecuted = 0;
  let finalStatus: FinalRunStatus = 'failed';
  let latestCommandResults: readonly CommandResult[] = [];
  let latestSmokeResults: readonly SmokeCheckResult[] = [];

  pushStage(timeline, now, 'run', 'started', `Run ${input.runId} started for ${input.stack}.`);

  while (attemptsExecuted <= maxFixRetries) {
    const attemptIndex = attemptsExecuted;
    const attemptLabel = attemptIndex === 0 ? 'initial' : `auto-fix-${attemptIndex}`;
    const commands =
      attemptIndex === 0
        ? input.baseCommands
        : deps.autoFixPlanner.createFixCommands({
            retryNumber: attemptIndex,
            latestCommandResults,
            latestSmokeResults,
          });

    if (attemptIndex > 0 && commands.length === 0) {
      pushStage(timeline, now, 'fix', 'failed', `${attemptLabel} produced no fix commands.`);
      blockerLogs.push({
        attemptLabel,
        reason: 'no_fix_commands',
        command: 'n/a',
        stderr: 'Auto-fix planner returned zero commands.',
      });
      break;
    }

    attemptsExecuted += 1;

    const attempt: ExecutionAttempt = {
      label: attemptLabel,
      workspacePath: input.workspacePath,
      stack: input.stack,
      sandboxMemoryMb: getSandboxMemoryMb(input.stack),
      commands,
    };

    pushStage(timeline, now, 'execute', 'started', `Running ${attemptLabel} with ${attempt.sandboxMemoryMb}MB.`);

    let executionPassed = false;

    try {
      const execution = await deps.daytonaAdapter.runAttempt(attempt);
      latestCommandResults = execution.commandResults;
      executionPassed = execution.ok;

      if (!execution.ok) {
        pushStage(timeline, now, 'execute', 'failed', execution.summary);
        blockerLogs.push(...toCommandBlockers(attemptLabel, execution.commandResults));
      } else {
        pushStage(timeline, now, 'execute', 'passed', execution.summary);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      latestCommandResults = [];
      latestSmokeResults = [];
      pushStage(timeline, now, 'execute', 'failed', message);
      blockerLogs.push({
        attemptLabel,
        reason: 'execution_adapter_error',
        command: 'n/a',
        stderr: message,
      });
    }

    if (executionPassed) {
      pushStage(timeline, now, 'smoke', 'started', `Running ${input.smokeChecks.length} smoke checks.`);
      latestSmokeResults = await runSmokeChecks(deps.commandRunner, input.smokeChecks);
      const allSmokePassed = latestSmokeResults.every((result) => result.passed);

      if (allSmokePassed) {
        pushStage(timeline, now, 'smoke', 'passed', `All smoke checks passed on ${attemptLabel}.`);
        finalStatus = 'success';
        break;
      }

      pushStage(timeline, now, 'smoke', 'failed', `Smoke checks failed on ${attemptLabel}.`);
      blockerLogs.push(...toSmokeBlockers(attemptLabel, latestSmokeResults, checksById));
    } else {
      pushStage(timeline, now, 'smoke', 'skipped', `Smoke checks skipped due to execution failure on ${attemptLabel}.`);
    }

    if (attemptsExecuted > maxFixRetries) {
      break;
    }

    retryCount += 1;
    pushStage(timeline, now, 'fix', 'started', `Scheduling auto-fix retry ${retryCount} of ${maxFixRetries}.`);
  }

  if (finalStatus !== 'success') {
    pushStage(timeline, now, 'run', 'failed', `Run ${input.runId} failed after ${attemptsExecuted} attempts.`);
  } else {
    pushStage(timeline, now, 'run', 'passed', `Run ${input.runId} completed successfully.`);
  }

  return {
    runId: input.runId,
    stack: input.stack,
    finalStatus,
    retryCount,
    attemptsExecuted,
    blockerLogs,
    timeline,
  };
}
