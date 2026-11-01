import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const binPath = fileURLToPath(new URL("../bin/hushtest.js", import.meta.url));

function run(target: string, args: string[]) {
  return spawnSync(process.execPath, [target, ...args], { encoding: "utf8" });
}

describe("cli", () => {
  it("prints the version", () => {
    const result = run(cliPath, ["--version"]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
    expect(result.stderr).toBe("");
  });

  it("prints help", () => {
    const result = run(cliPath, ["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage: hushtest");
  });

  it("starts through the bin entry point", () => {
    const result = run(binPath, ["--version"]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
  });

  it("rejects unknown commands", () => {
    const result = run(cliPath, ["nope"]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('unknown command "nope"');
  });

  it("rejects unknown options", () => {
    const result = run(cliPath, ["--nope"]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("hushtest:");
  });
});
