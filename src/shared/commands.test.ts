import { describe, expect, it } from "vitest";
import { defaultSettings, disabledPresetId, type PackagePickerSettings } from "./settings";
import { rewriteShellSnippet } from "./commands";

describe("rewriteShellSnippet", () => {
  it("maps every bundled preset to its install, add, and package-runner commands", () => {
    const expectations = [
      ["npm", "npm install react", "npm install", "npx cowsay"],
      ["pnpm", "pnpm add react", "pnpm install", "pnpm dlx cowsay"],
      ["yarn", "yarn add react", "yarn install", "yarn dlx cowsay"],
      ["bun", "bun add react", "bun install", "bunx cowsay"],
      ["nub", "nub add react", "nub install", "nubx cowsay"],
      ["aube", "aube add react", "aube install", "aubx cowsay"]
    ] as const;

    for (const [preset, addCommand, installCommand, runnerCommand] of expectations) {
      expect(rewriteShellSnippet("npm install react", manager(preset))).toBe(addCommand);
      expect(rewriteShellSnippet("npm install", manager(preset))).toBe(installCommand);
      expect(rewriteShellSnippet("npx cowsay", manager(preset))).toBe(runnerCommand);
    }
  });

  it("rewrites npm install package commands to pnpm add by default", () => {
    expect(rewriteShellSnippet("npm install next react react-dom", defaultSettings)).toBe(
      "pnpm add next react react-dom"
    );
  });

  it("rewrites npm i package aliases", () => {
    expect(rewriteShellSnippet("$ npm i -D vite", defaultSettings)).toBe("$ pnpm add -D vite");
  });

  it("keeps dependency install commands as install", () => {
    expect(rewriteShellSnippet("npm install", manager("bun"))).toBe("bun install");
  });

  it("maps npm ci to the selected manager clean install", () => {
    expect(rewriteShellSnippet("npm ci", manager("yarn"))).toBe("yarn install --immutable");
  });

  it("rewrites npx commands", () => {
    expect(rewriteShellSnippet("npx create-next-app@latest my-app", defaultSettings)).toBe(
      "pnpm dlx create-next-app@latest my-app"
    );
  });

  it("drops npx confirmation flags for alternate runners", () => {
    expect(rewriteShellSnippet("npx --yes create-vite@latest", defaultSettings)).toBe(
      "pnpm dlx create-vite@latest"
    );
  });

  it("rewrites npm exec commands", () => {
    expect(rewriteShellSnippet("npm exec next -- --help", manager("bun"))).toBe(
      "bunx next -- --help"
    );
  });

  it("supports newer bundled presets like nub and aube", () => {
    expect(rewriteShellSnippet("npm install left-pad", manager("nub"))).toBe("nub add left-pad");
    expect(rewriteShellSnippet("npx cowsay hello", manager("aube"))).toBe("aubx cowsay hello");
  });

  it("does not rewrite prose or unsupported npm commands", () => {
    expect(rewriteShellSnippet("Run npm install next to start.", defaultSettings)).toBe(
      "Run npm install next to start."
    );
    expect(rewriteShellSnippet("npm publish", defaultSettings)).toBe("npm publish");
  });

  it("can be disabled", () => {
    expect(rewriteShellSnippet("npm install next", manager(disabledPresetId))).toBe(
      "npm install next"
    );
  });
});

function manager(presetId: string): PackagePickerSettings {
  return { ...defaultSettings, presetId };
}
