# hushtest

An agent-first API testing CLI, run in a project with one command (`npx` or `bunx`) and no setup.

The agent supplies only the endpoints to test and the path to the env file. It writes requests with placeholders such as `{{API_TOKEN}}`, and the tool injects the real values from the env file into the outgoing request, so the agent never needs to read, handle, or paste a secret.

Every output path is scrubbed of secret values, raw and in common encodings. Responses come back as structured, token-efficient JSON with built-in assertions and pass/fail results. A host allowlist and request caps keep a confused agent from sending credentials or traffic to the wrong place. A skill file tells the agent to route all API testing through the tool.

The guarantee is scoped: through the tool, env values never reach the agent. It does not claim to stop an agent that deliberately reads the env file itself.
