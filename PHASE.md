# hushtest phases

Version 0.1 — 2026-10-30

Status: draft

This document turns `RULES.md` into build phases. Each phase solves one class of problem, and each file has one job. If a file's purpose needs "and" to describe it, it should probably be split.

Every phase ends with: tests passing, `CHANGELOG.md` updated, and a check against `RULES.md`.

## Phase 0 — Make the project buildable

**Problem:** nothing can run, be tested, or be published. Every later change would be unverifiable.

| File | Problem it solves |
|---|---|
| `package.json` (update) | Defines scripts, Node engine, `bin`, and what ships to npm. |
| `tsconfig.json` | Strict typing catches wiring mistakes before runtime. |
| `tsup.config.ts` | Bundles everything into one JS file so users install zero dependencies. |
| `bin/hushtest.js` | Stable `npx hushtest` entry point, independent of internal file layout. |
| `src/cli.ts` | Owns argv, help/version, and exit codes. Isolates the messy boundary so core code receives typed input. |
| `tests/smoke.test.ts` | Proves the CLI starts and the build/test pipeline works. |
| `.github/workflows/ci.yml` | Builds, typechecks, tests, and pack-checks every push. |
| `.gitignore` | Keeps `node_modules`, `dist`, coverage, and tarballs out of git. |
| `vitest.config.ts` (optional) | Test config; Vitest uses Vite internally, dev-only. Not a Vite app. |

## Phase 1 — Protect env values

**Problem:** env values must be read and made usable without entering any output, log, file, or error. This is the actual feature.

| File | Problem it solves |
|---|---|
| `src/env.ts` | The only place an env file is read and parsed. Enforces project scope, permissions, and symlinks; never touches `process.env`. |
| `src/secrets.ts` | Holds values in one registry, gives them labels, and generates encoded variants. One accessor for injection. |
| `src/redact.ts` | The single scrub boundary for strings, JSON, headers, and errors. Fails closed when removal cannot be guaranteed. |
| `src/errors.ts` | Stable error codes and safe messages. Turns "errors are a leak path" into a design constraint. |
| `src/output.ts` | Schema v1 and the only stdout writer. No ad-hoc `console.log` can bypass scrubbing. |
| `tests/env.test.ts` | Unit proof for parsing and path boundaries. |
| `tests/secrets.test.ts` | Unit proof for registry behavior and encoding variants. |
| `tests/redact.test.ts` | Unit proof for structured scrubbing and fail-closed behavior. |
| `tests/fixtures/.env.canary` | Known fake secret used to prove absence everywhere. |

Why first: every later file imports these. No request path is allowed to exist without them.

## Phase 2 — Send requests safely

**Problem:** inject secrets into real HTTP requests without letting them reach the wrong destination or come back into output. Loopback-only by default.

| File | Problem it solves |
|---|---|
| `src/template.ts` | Detects and resolves `{{KEY}}`. Rejects unknown keys and misplaced placeholders; the only way a value enters a request. |
| `src/policy.ts` | Allowlist, URL validation, redirect refusal, and location rules: headers and JSON bodies only; no URLs, query strings, or cookies. |
| `src/caps.ts` | Request, byte, and time budgets. Stops runaway loops and oversized responses. |
| `src/http.ts` | The single network egress. Timeouts, size caps, no redirects, safe transport errors. |
| `src/execute.ts` | Orchestrates exactly one request. Small and auditable because it is the only function touching both a secret and the network. |
| `tests/e2e/canary.test.ts` | Local echo server returns headers and body; assert the canary appears nowhere. This is feature 1's acceptance test. |
| `tests/policy.test.ts` | Allowlist, redirect, and URL edge cases. |
| `tests/template.test.ts` | Placeholder parsing and placement edge cases. |

Why second: Phase 1 unit tests are not the promise. This phase proves the promise end to end.

## Phase 3 — Make it a testing tool

**Problem:** one request is not a test suite. Agents need declarative tests, assertions, and machine-readable pass/fail.

| File | Problem it solves |
|---|---|
| `src/suite.ts` | Loads and validates the JSON suite. Good errors are the agent's primary debugging tool. |
| `src/assert.ts` | Status, JSON path, header, and duration assertions. Converts responses to pass/fail without exposing values. |
| `src/json-path.ts` | Small path evaluator so JSON assertions do not require a heavy dependency. |
| `src/runner.ts` | Runs tests in order, aggregates results, and maps outcomes to exit codes. |
| `src/cli.ts` (update) | Adds `run`, the first interface a developer actually uses. |
| `tests/suite.test.ts` | Suite validation and error reporting. |
| `tests/assert.test.ts` | Assertion semantics and redaction of actual values. |
| `tests/runner.test.ts` | Ordering, aggregation, and exit codes. |
| `tests/fixtures/suites/*.json` | Reproducible suite inputs. |

## Phase 4 — Human guardrails and derived secrets

**Problem:** remote APIs need explicit human permission; APIs mint credentials not present in env; mutating calls need visibility; setup should happen once.

| File | Problem it solves |
|---|---|
| `src/config.ts` | Loads `hushtest.config.json`. Human-owned allowlist and caps; agent flags cannot widen them. |
| `src/init.ts` | Writes a safe starter config. Prevents hand-editing mistakes. |
| `src/redact.ts` (update) | Adds documented derived-credential rules (`set-cookie`, token-ish keys, configured headers). |
| `src/runner.ts` (update) | Labels state-changing requests and supports `--dry-run` with redacted output. |
| `tests/config.test.ts` | Config loading, defaults, and precedence. |
| `tests/derived-redaction.test.ts` | Minted tokens, cookies, and configured response fields are removed. |
| `tests/dry-run.test.ts` | Dry runs validate without network traffic or side effects. |

## Phase 5 — Make agents use it

**Problem:** a secure tool nobody invokes is worthless, and docs must claim only what tests prove.

| File | Problem it solves |
|---|---|
| `skill/hushtest/SKILL.md` | Tells agents when and how to route all API testing through the tool. |
| `src/skill.ts` | Prints or installs the skill from one command. |
| `README.md` (update) | Usage, guarantee, and explicit non-goals. |
| `SECURITY.md` (optional) | Threat model and reporting boundary, so trust does not depend on marketing. |
| `CHANGELOG.md` (update) | Records `0.1.0` and each phase's changes. |
| `.github/workflows/publish.yml` (optional) | Tag-based publish with provenance. |
| `tests/pack.test.ts` | Proves the published tarball matches what was tested. |

## Deferred

- `src/auth.ts` for login → token chaining.
- Reporters beyond JSON.
- YAML suites.
- Parallel request execution.
- JSON Schema assertions.

## Decisions still open

1. TypeScript, Node >= 20, bundled, zero runtime dependencies.
2. JSON-only suites for v1.
3. Optional human config with loopback default.
4. Derived redaction by documented header and key names.
5. Side effects: label mutating requests plus `--dry-run`, or deny mutations by default.

The progression is deliberate: Phase 1 builds the guarantee, Phase 2 proves it, Phase 3 makes it useful, Phase 4 lets it leave localhost safely, and Phase 5 distributes it.
