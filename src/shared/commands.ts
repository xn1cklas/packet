import { isRewriteEnabled, resolvePackageManager, type PackagePickerSettings } from "./settings";

const commandLinePattern =
  /^(?<prefix>\s*(?:(?:[$>#]|❯)\s*)?)(?<sudo>sudo\s+)?(?<command>npx|npm)(?<tail>(?:\s+[^\r\n]*)?)$/u;

const npxConfirmationFlags = new Set(["-y", "--yes"]);

type NpmCommand =
  | { kind: "add"; args: string[] }
  | { kind: "install"; args: string[] }
  | { kind: "ci"; args: string[] }
  | { kind: "dlx"; args: string[] }
  | { kind: "create"; args: string[] };

export function rewriteShellSnippet(text: string, settings: PackagePickerSettings): string {
  if (!isRewriteEnabled(settings) || (!text.includes("npm") && !text.includes("npx"))) {
    return text;
  }

  return text
    .split(/(\r?\n)/u)
    .map((part) => (part === "\n" || part === "\r\n" ? part : rewriteLine(part, settings)))
    .join("");
}

function rewriteLine(line: string, settings: PackagePickerSettings): string {
  const match = commandLinePattern.exec(line);
  if (!match?.groups) {
    return line;
  }

  const prefix = match.groups.prefix ?? "";
  const sudo = match.groups.sudo ?? "";
  const command = match.groups.command;
  const tail = (match.groups.tail ?? "").trim();

  const replacement = command === "npx" ? rewriteNpx(tail, settings) : rewriteNpm(tail, settings);
  if (!replacement) {
    return line;
  }

  return `${prefix}${sudo}${replacement}`;
}

function rewriteNpx(tail: string, settings: PackagePickerSettings): string | undefined {
  const manager = resolvePackageManager(settings);
  const args = tokenizeShellWords(tail).filter((part) => !npxConfirmationFlags.has(part));

  if (args.length === 0) {
    return manager.dlxCommand;
  }

  return joinCommand(manager.dlxCommand, args);
}

function rewriteNpm(tail: string, settings: PackagePickerSettings): string | undefined {
  const parsed = parseNpmCommand(tokenizeShellWords(tail));
  if (!parsed) {
    return undefined;
  }

  const manager = resolvePackageManager(settings);

  switch (parsed.kind) {
    case "add":
      return joinCommand(manager.addCommand, parsed.args);
    case "install":
      return joinCommand(manager.installCommand, parsed.args);
    case "ci":
      return joinCommand(manager.ciCommand, parsed.args);
    case "dlx":
      return joinCommand(
        manager.dlxCommand,
        parsed.args.filter((part) => !npxConfirmationFlags.has(part))
      );
    case "create":
      return joinCommand(manager.createCommand, parsed.args);
  }
}

function parseNpmCommand(args: string[]): NpmCommand | undefined {
  const [subcommand, ...rest] = args;

  if (!subcommand) {
    return undefined;
  }

  if (subcommand === "install" || subcommand === "i" || subcommand === "add") {
    return hasPackageArgument(rest) ? { kind: "add", args: rest } : { kind: "install", args: rest };
  }

  if (subcommand === "ci") {
    return { kind: "ci", args: rest };
  }

  if (subcommand === "exec" || subcommand === "x") {
    return { kind: "dlx", args: rest };
  }

  if (subcommand === "create" || subcommand === "init") {
    return { kind: "create", args: rest };
  }

  return undefined;
}

function hasPackageArgument(args: string[]): boolean {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }

    if (arg === "--") {
      return args.slice(index + 1).some((candidate) => candidate.length > 0);
    }

    if (!arg.startsWith("-")) {
      return true;
    }

    if (flagConsumesNextValue(arg)) {
      index += 1;
    }
  }

  return false;
}

function flagConsumesNextValue(arg: string): boolean {
  if (arg.includes("=")) {
    return false;
  }

  return [
    "--cache",
    "--cache-min",
    "--cache-max",
    "--cert",
    "--cidr",
    "--color",
    "--depth",
    "--fetch-retries",
    "--fetch-retry-factor",
    "--fetch-retry-maxtimeout",
    "--fetch-retry-mintimeout",
    "--https-proxy",
    "--key",
    "--loglevel",
    "--offline",
    "--omit",
    "--only",
    "--prefix",
    "--proxy",
    "--registry",
    "--tag",
    "--userconfig",
    "--workspace"
  ].includes(arg);
}

function joinCommand(baseCommand: string, args: string[]): string {
  const suffix = args.join(" ").trim();
  return suffix.length > 0 ? `${baseCommand} ${suffix}` : baseCommand;
}

function tokenizeShellWords(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | undefined;
  let escaped = false;

  for (const char of input.trim()) {
    if (escaped) {
      current += `\\${char}`;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      current += char;
      if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (/\s/u.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (escaped) {
    current += "\\";
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}
