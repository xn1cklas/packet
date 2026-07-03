export type PackageManagerPresetId = "npm" | "pnpm" | "yarn" | "bun" | "nub" | "aube";

export type PackageManagerPreset = {
  id: PackageManagerPresetId;
  label: string;
  installCommand: string;
  addCommand: string;
  dlxCommand: string;
  createCommand: string;
  ciCommand: string;
};

export const packageManagerPresets: readonly PackageManagerPreset[] = [
  {
    id: "npm",
    label: "npm",
    installCommand: "npm install",
    addCommand: "npm install",
    dlxCommand: "npx",
    createCommand: "npm create",
    ciCommand: "npm ci"
  },
  {
    id: "pnpm",
    label: "pnpm",
    installCommand: "pnpm install",
    addCommand: "pnpm add",
    dlxCommand: "pnpm dlx",
    createCommand: "pnpm create",
    ciCommand: "pnpm install --frozen-lockfile"
  },
  {
    id: "yarn",
    label: "yarn",
    installCommand: "yarn install",
    addCommand: "yarn add",
    dlxCommand: "yarn dlx",
    createCommand: "yarn create",
    ciCommand: "yarn install --immutable"
  },
  {
    id: "bun",
    label: "bun",
    installCommand: "bun install",
    addCommand: "bun add",
    dlxCommand: "bunx",
    createCommand: "bun create",
    ciCommand: "bun install --frozen-lockfile"
  },
  {
    id: "nub",
    label: "nub",
    installCommand: "nub install",
    addCommand: "nub add",
    dlxCommand: "nubx",
    createCommand: "nub create",
    ciCommand: "nub ci"
  },
  {
    id: "aube",
    label: "aube",
    installCommand: "aube install",
    addCommand: "aube add",
    dlxCommand: "aubex",
    createCommand: "aube create",
    ciCommand: "aube ci"
  }
] as const;

export function getPreset(id: string): PackageManagerPreset | undefined {
  return packageManagerPresets.find((preset) => preset.id === id);
}
