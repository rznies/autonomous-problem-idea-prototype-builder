import type { CommandRunner, SmokeCheck, SmokeCheckResult } from './contracts.js';

export async function runSmokeChecks(
  commandRunner: CommandRunner,
  checks: readonly SmokeCheck[],
): Promise<readonly SmokeCheckResult[]> {
  const results: SmokeCheckResult[] = [];

  for (const check of checks) {
    const response = await commandRunner.run(check.command);
    const allowedExitCodes = check.allowedExitCodes ?? [0];
    const passed = allowedExitCodes.includes(response.exitCode);

    results.push({
      id: check.id,
      exitCode: response.exitCode,
      stdout: response.stdout,
      stderr: response.stderr,
      passed,
    });
  }

  return results;
}
