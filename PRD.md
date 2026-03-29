# MVP PRD: Autonomous Problem -> Idea -> Prototype Builder

## Problem Statement

Early-stage builders waste time guessing what to build. They read scattered complaints, manually summarize pain points, brainstorm ideas, and still spend hours turning an idea into even a basic proof-of-concept. The user needs a single prototype system that can do this loop end-to-end in one run: gather real complaints, identify top problems, generate practical ideas, pick one, and produce a working local prototype.

The immediate goal is not quality, scale, or full automation. The goal is proving capability: an agent can move from real-world pain signals to a runnable prototype with minimal human intervention.

## Solution

Build a lean, single-run pipeline that reads source URLs from a JSON config, scrapes complaint-heavy content, extracts the top five recurring problems, generates 2-3 ideas per problem, automatically selects one idea by simple scoring, scaffolds a minimal prototype, and executes it in Daytona.

The prototype generator chooses the smallest practical stack:
- Node + HTML for very simple workflows
- Vite + TypeScript for slightly more interactive workflows

Execution is validated with CLI-level smoke checks only. If execution fails, the system attempts up to two automated fix rounds, then stops and reports blockers.

## User Stories

1. As a founder, I want to provide a small list of source URLs in JSON, so that I can control where the system pulls problems from.
2. As a founder, I want the system to scrape real complaint content from Reddit and reviews, so that inputs are grounded in actual user pain.
3. As a founder, I want the system to normalize noisy scraped text, so that downstream analysis is consistent.
4. As a founder, I want the system to identify repeated complaints, so that one-off noise is filtered out.
5. As a founder, I want exactly five top problems returned, so that I can review a focused shortlist.
6. As a founder, I want each problem to include supporting evidence snippets, so that I can verify claims quickly.
7. As a founder, I want each problem to include source links, so that I can audit where the insight came from.
8. As a founder, I want 2-3 ideas generated per problem, so that I have realistic alternatives without analysis overload.
9. As a founder, I want ideas constrained to buildable-in-hours scope, so that the system avoids over-ambitious concepts.
10. As a founder, I want each idea to include expected complexity, so that the selector can avoid risky picks.
11. As a founder, I want one idea selected automatically, so that the run can continue without manual decision gates.
12. As a founder, I want selection rationale recorded, so that I can understand why that idea won.
13. As a founder, I want simple ideas to generate Node + HTML apps, so that build time stays low.
14. As a founder, I want moderately interactive ideas to generate Vite + TypeScript apps, so that functionality stays manageable but usable.
15. As a founder, I want generated code saved as artifacts, so that I can inspect and rerun it locally.
16. As a founder, I want prototype execution to happen inside Daytona, so that run behavior is isolated and reproducible.
17. As a founder, I want Node + HTML runs to use 2GB RAM sandboxes, so that Tier 1 credit usage stays efficient.
18. As a founder, I want Vite + TypeScript runs to use 4GB RAM sandboxes, so that moderate builds remain stable.
19. As a founder, I want command output logs captured, so that failures are diagnosable.
20. As a founder, I want CLI-level smoke checks to determine success, so that validation remains fast and deterministic.
21. As a founder, I want the system to auto-fix failures up to two retries, so that common errors resolve without manual debugging.
22. As a founder, I want the run to stop after two failed retries, so that time and credits are not wasted.
23. As a founder, I want every stage output persisted, so that I can audit the full decision chain.
24. As a founder, I want a single run report summarizing problem -> idea -> prototype, so that I can quickly evaluate result quality.
25. As a founder, I want the control UI to show stage-by-stage progress, so that I can trust the system is advancing.
26. As a founder, I want the first MVP to run once on demand only, so that complexity stays low.
27. As a founder, I want no auth or multi-user setup in MVP, so that implementation time stays minimal.
28. As a founder, I want clear success/failure status for each run, so that I know immediately whether a prototype is working.
29. As a founder, I want the pipeline to fail fast on missing API keys or invalid URL config, so that wasted compute is minimized.
30. As a founder, I want reproducible runs from the same inputs, so that I can iterate on source quality and prompts systematically.

## Implementation Decisions

- Use a single orchestrator flow built on OpenAI Agent SDK, not a multi-agent swarm.
- Keep run mode as explicit one-shot execution started by user action.
- Use Firecrawl as the scraping tool for all external content ingestion.
- Use a JSON config as the only source input contract.
- Use strict structured outputs between stages to reduce prompt drift and parsing errors.
- Define stage boundaries explicitly: scrape, extract, ideate, select, scaffold, execute, fix, report.
- Store run artifacts locally in a deterministic structure for debugging and replay.
- Use deterministic scoring for idea selection rather than opaque free-form choice.
- Use stack selection policy based on implementation complexity (simple -> Node/HTML, moderate -> Vite/TS).
- Keep generated apps minimal: one core value path, no authentication, no non-essential integrations.
- Execute prototypes in Daytona sandboxes with resource policy tied to selected stack.
- Apply 2GB memory for Node/HTML builds and 4GB memory for Vite/TS builds.
- Use short-lived ephemeral sandboxes and immediate cleanup after run completion/failure.
- Use CLI command execution and CLI smoke checks as the only MVP runtime verification.
- Cap auto-fix attempts to exactly two retries after initial failure.
- Record every command, stdout/stderr, and exit status in execution artifacts.
- Fail fast on invalid inputs, missing credentials, schema errors, and unrecoverable execution failures.
- Preserve compatibility with existing repository direction (OpenAI Agents SDK usage) while extending into the MVP pipeline domain.

## Testing Decisions

- Good tests validate externally observable behavior and contracts, not prompt wording or internal implementation details.
- Core test focus is stage correctness and run determinism at boundaries.
- Validate configuration ingestion: malformed JSON, empty URL list, invalid URL formats, duplicate URLs.
- Validate scraping stage output contract: required fields present, source attribution preserved.
- Validate extraction stage contract: exactly top five problems, evidence and sources required.
- Validate ideation stage contract: per-problem idea count and required scoring fields.
- Validate selection stage determinism: same inputs produce same selected idea.
- Validate stack selection policy: simple ideas route to Node/HTML, moderate ideas route to Vite/TS.
- Validate Daytona resource assignment: Node/HTML requests 2GB, Vite/TS requests 4GB.
- Validate retry policy: at most two fix attempts are executed.
- Validate success criteria: run marked successful only when CLI smoke check passes.
- Validate failure criteria: run marked failed with actionable logs when retries are exhausted.
- Validate artifact integrity: all expected stage files and final report are generated per run.
- Use a layered strategy:
  - unit tests for scoring, routing, and schema validation
  - integration tests for orchestrator stage transitions with mocked external APIs
  - minimal end-to-end happy-path test against sandbox execution in controlled conditions

## Out of Scope

- Continuous scheduling or autonomous recurring runs.
- Multi-agent orchestration or role-specialized agent swarms.
- Human-in-the-loop review dashboards and advanced analytics.
- Production deployment pipeline and hosting automation.
- User authentication, user management, or multi-tenant access control.
- Long-term memory, idea ranking history, or historical trend analysis.
- Sophisticated ranking models beyond simple deterministic scoring.
- Browser-level QA checks or visual regression checks.
- Enterprise reliability features (queues, distributed workers, horizontal scaling).

## Further Notes

- This PRD intentionally prioritizes proof-of-capability over architecture purity.
- The fastest path is explicit logic, strict artifacts, and small, predictable runtime behavior.
- The MVP should be considered successful when it can repeatedly go from real complaints to one working prototype with traceable evidence.
- After validation, next increments can add scheduled runs, better idea ranking, and automated deployment.
