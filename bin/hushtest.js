#!/usr/bin/env node

try {
  const { start } = await import("../dist/cli.js");
  start(process.argv.slice(2));
} catch {
  process.stderr.write(
    "hushtest: failed to start. Reinstall the package or run `npm run build`.\n",
  );
  process.exitCode = 1;
}
