import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const VERSION = (
  JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version: string }
).version;

const HELP = `Usage: hushtest <command> [options]

Commands:
  run [suite]    Run an API test suite (not implemented yet)

Options:
  -h, --help     Show this help
  -v, --version  Show the version
`;

export const EXIT_OK = 0;
export const EXIT_USAGE = 2;

export interface CliIo {
  stdout(text: string): void;
  stderr(text: string): void;
}

const processIo: CliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

function parse(argv: readonly string[]) {
  return parseArgs({
    args: [...argv],
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
}

type Parsed = ReturnType<typeof parse>;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function main(argv: readonly string[], io: CliIo = processIo): number {
  let parsed: Parsed;
  try {
    parsed = parse(argv);
  } catch (error) {
    io.stderr(`hushtest: ${messageOf(error)}\n\n${HELP}`);
    return EXIT_USAGE;
  }

  if (parsed.values.help === true) {
    io.stdout(HELP);
    return EXIT_OK;
  }

  if (parsed.values.version === true) {
    io.stdout(`${VERSION}\n`);
    return EXIT_OK;
  }

  const command = parsed.positionals[0];
  if (command === undefined) {
    io.stdout(HELP);
    return EXIT_OK;
  }

  if (command === "run") {
    io.stderr("hushtest: run is not implemented yet\n");
    return EXIT_USAGE;
  }

  io.stderr(`hushtest: unknown command "${command}"\n\n${HELP}`);
  return EXIT_USAGE;
}

export function start(argv: readonly string[]): void {
  process.exitCode = main(argv);
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  start(process.argv.slice(2));
}
