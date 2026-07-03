import { describe, expect, it } from "vitest";
import { defaultSettings, type PackagePickerSettings } from "./settings";
import { rewriteShellSnippet } from "./commands";

describe("rewriteShellSnippet", () => {
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

  it("supports named custom-style presets like nub and aube", () => {
    expect(rewriteShellSnippet("npm install left-pad", manager("nub"))).toBe("nub add left-pad");
    expect(rewriteShellSnippet("npx cowsay hello", manager("aube"))).toBe("aubex cowsay hello");
  });

  it("supports explicit custom templates", () => {
    const settings: PackagePickerSettings = {
      ...defaultSettings,
      presetId: "custom",
      customLabel: "acme",
      customInstallCommand: "acme install",
      customAddCommand: "acme put",
      customDlxCommand: "acme runpkg",
      customCreateCommand: "acme create",
      customCiCommand: "acme restore --locked"
    };

    expect(rewriteShellSnippet("npm install @scope/pkg", settings)).toBe("acme put @scope/pkg");
    expect(rewriteShellSnippet("npx @scope/tool --help", settings)).toBe(
      "acme runpkg @scope/tool --help"
    );
  });

  it("does not rewrite prose or unsupported npm commands", () => {
    expect(rewriteShellSnippet("Run npm install next to start.", defaultSettings)).toBe(
      "Run npm install next to start."
    );
    expect(rewriteShellSnippet("npm publish", defaultSettings)).toBe("npm publish");
  });

  it("can be disabled", () => {
    expect(rewriteShellSnippet("npm install next", { ...defaultSettings, enabled: false })).toBe(
      "npm install next"
    );
  });
});

function manager(presetId: string): PackagePickerSettings {
  return { ...defaultSettings, presetId };
}
