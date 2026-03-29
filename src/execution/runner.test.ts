import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
  AutoFixPlanner,
  CommandResult,
  CommandRunner,
  DaytonaExecutionAdapter,
  ExecutionAttempt,
  ExecutionAttemptResult,
  RunExecutionInput,
  SmokeCheckResult,
} from './contracts.js';
import { executeRunWithAutoFix } from './runner.js';

class SequenceDaytonaAdapter implements DaytonaExecutionAdapter {
  public readonly receivedAttempts: ExecutionAttempt[] = [];

  public constructor(private readonly responses: readonly ExecutionAttemptResult[]) {}

  async runAttempt(attempt: ExecutionAttempt): Promise<ExecutionAttemptResult> {
    this.receivedAttempts.push(attempt);
    const response = this.responses[this.receivedAttempts.length - 1];
    if (!response) {
      throw new Error('No adapter response configured for attempt.');
    }
    return response;
  }
}

class SequenceCommandRunner implements CommandRunner {
  public readonly commandsRun: string[] = [];
  private cursor = 0;

  public constructor(private readonly responses: readonly SmokeCheckResult[]) {}

  async run(command: { readonly cmd: string; readonly args?: readonly string[] }): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    const formatted = [command.cmd, ...(command.args ?? [])].join(' ').trim();
    this.commandsRun.push(formatted);

    const response = this.responses[this.cursor];
    this.cursor += 1;

    if (!response) {
      throw new Error('No smoke result configured for command run.');
    }

    return {
      exitCode: response.exitCode,
      stdout: response.stdout,
      stderr: response.stderr,
    };
  }
}

class TrackingAutoFixPlanner implements AutoFixPlanner {
  public readonly calls: number[] = [];

  createFixCommands(context: {
    readonly retryNumber: number;
    readonly latestCommandResults: readonly CommandResult[];
    readonly latestSmokeResults: readonly SmokeCheckResult[];
  }) {
    this.calls.push(context.retryNumber);
    return [
      {
        cmd: 'npm',
        args: ['run', `fix-${context.retryNumber}`],
      },
    ];
  }
}

function makeInput(): RunExecutionInput {
  return {
    runId: 'run-123',
    workspacePath: '/tmp/work',
    stack: 'vite-ts',
    baseCommands: [
      {
        cmd: 'npm',
        args: ['run', 'build'],
      },
    ],
    smokeChecks: [
      {
        id: 'http-200',
        command: {
          cmd: 'node',
          args: ['scripts/smoke.js'],
        },
      },
    ],
  };
}

test('enforces retry cap of two fix attempts', async () => {
  const failureResult: ExecutionAttemptResult = {
    ok: false,
    summary: 'Build failed',
    commandResults: [
      {
        command: { cmd: 'npm', args: ['run', 'build'] },
        exitCode: 1,
        stdout: '',
        stderr: 'TS error',
      },
    ],
  };

  const adapter = new SequenceDaytonaAdapter([failureResult, failureResult, failureResult]);
  const planner = new TrackingAutoFixPlanner();
  const smokeRunner = new SequenceCommandRunner([]);

  const report = await executeRunWithAutoFix(makeInput(), {
    daytonaAdapter: adapter,
    commandRunner: smokeRunner,
    autoFixPlanner: planner,
    now: () => '2026-03-29T00:00:00.000Z',
  });

  assert.equal(report.finalStatus, 'failed');
  assert.equal(report.retryCount, 2);
  assert.equal(report.attemptsExecuted, 3);
  assert.deepEqual(planner.calls, [1, 2]);
  assert.equal(adapter.receivedAttempts.length, 3);
  assert.deepEqual(
    adapter.receivedAttempts.map((attempt) => attempt.sandboxMemoryMb),
    [4096, 4096, 4096],
  );
  assert.equal(smokeRunner.commandsRun.length, 0);
});

test('fail-stops with blocker logs when smoke checks keep failing', async () => {
  const executionSuccess: ExecutionAttemptResult = {
    ok: true,
    summary: 'Commands passed',
    commandResults: [
      {
        command: { cmd: 'npm', args: ['run', 'build'] },
        exitCode: 0,
        stdout: 'ok',
        stderr: '',
      },
    ],
  };

  const adapter = new SequenceDaytonaAdapter([executionSuccess, executionSuccess, executionSuccess]);
  const planner = new TrackingAutoFixPlanner();
  const smokeRunner = new SequenceCommandRunner([
    { id: 'http-200', exitCode: 1, stdout: '', stderr: 'service down', passed: false },
    { id: 'http-200', exitCode: 1, stdout: '', stderr: 'service down', passed: false },
    { id: 'http-200', exitCode: 1, stdout: '', stderr: 'service down', passed: false },
  ]);

  const report = await executeRunWithAutoFix(makeInput(), {
    daytonaAdapter: adapter,
    commandRunner: smokeRunner,
    autoFixPlanner: planner,
    now: () => '2026-03-29T00:00:00.000Z',
  });

  assert.equal(report.finalStatus, 'failed');
  assert.equal(report.retryCount, 2);
  assert.equal(report.attemptsExecuted, 3);
  assert.equal(
    report.blockerLogs.filter((entry) => entry.reason === 'smoke_check_failed').length,
    3,
  );
  assert.equal(report.timeline.at(-1)?.stage, 'run');
  assert.equal(report.timeline.at(-1)?.status, 'failed');
  assert.match(report.timeline.at(-1)?.detail ?? '', /failed after 3 attempts/);
});
