# hushtest build rules

Version 0.1 — 2026-10-30

These are the non-negotiables for hushtest. A feature that violates one is rejected or redesigned. When rules conflict, env protection (rules 6–13) outranks ergonomics and convenience (rules 14–17).

## Product boundary

1. **One product.** An API testing tool for agents. Reject features that primarily serve secret management, HTTP debugging, or agent sandboxing.
2. **The promise is tool-scoped.** While a run is active, env values exist only in tool memory and the outgoing request. Never claim the agent cannot obtain them another way, such as reading the env file or running shell commands itself.
3. **Zero setup for the agent, explicit config for the human.** `npx` and `bunx` must work without an install step. Any safety configuration is one-time and owned by the human.
4. **Local by default.** The host allowlist denies everything except loopback (`localhost`, `127.0.0.1`, `::1`) until a human adds a host. The agent cannot widen it.
5. **Caps are human-owned and run-wide.** Requests, bytes, time, redirects, and concurrency are bounded for the whole run, not just one request.

## Env protection

6. **Secrets have exactly one exit: the outgoing request.** They never appear in argv, child-process environments, temp files, logs, caches, reports, stack traces, errors, or stdout. If a path cannot guarantee that, do not ship the path.
7. **No interface reveals a value.** No env dump, rendered-request preview, or verbose bypass. Debug output shows shape — keys, lengths, fingerprints — never contents.
8. **Inject only into declared auth slots.** Secrets in paths, query strings, and cookies are rejected by default. A human may opt in per endpoint, with a warning that server-side logs are outside the guarantee.
9. **One scrub boundary.** Every tool-controlled sink passes through the same scrub step before anything is written or emitted. The placeholder is `[REDACTED:<NAME>]`. Raw responses are never emitted. If redaction is uncertain, the run fails closed.
10. **Redaction is designed, not regex.** Output stays valid and structured: JSON remains valid, headers are handled by name, and binary or compressed bodies have defined behavior.
11. **Derived credentials are secrets.** Tokens, cookies, and signed URLs minted by the API are redacted too. Detection must be explicit and documented — declared response fields or headers, not best-effort guessing.
12. **The env file is a boundary.** Paths are project-scoped, permission-checked, and symlink-resolved. Errors name keys, never values or file contents.
13. **No security theater.** Every security feature closes a named leak in the threat model. Encryption at rest, obfuscation, and anti-shell measures are rejected unless they do.

## Execution and output

14. **Output is minimal and structured.** Stable, versioned JSON containing status, assertion results, redacted responses, and stable error codes. No raw bodies by default.
15. **Agent ergonomics are correctness.** Deterministic exit codes, actionable failures that contain no secrets, and token-efficient defaults. If an agent must read the source to use the tool, it is not done.
16. **Side effects are visible.** Requests that can change state are labeled, and a safe default (read-only or dry-run) exists so a test run does not silently mutate production.
17. **No telemetry by default.** Never send request data, env names, or hostnames anywhere. Any telemetry is opt-in.

## Distribution and verification

18. **Trust extends to distribution.** Minimal dependencies, no postinstall network access, pinned and provenance-verified releases.
19. **No claim without a canary test.** The README may claim only what the suite proves. Security tests use canary env values and assert their absence from every sink, including logs and generated files, under normal and adversarial requests.
20. **Docs and code move together.** A behavior change updates the rule, the claim, and the test in the same change.

## Out of scope

- An agent that deliberately reads `.env` or other files.
- Secrets appearing in the API server's own logs.
- Preventing an agent from bypassing the tool.
- Secret management, encryption, or vault features.
- General-purpose HTTP client features not needed for API testing.
