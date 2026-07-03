import { getPreset, packageManagerPresets } from "./package-managers";

export type PackagePickerSettings = {
  presetId: string;
};

export type EffectivePackageManager = {
  label: string;
  installCommand: string;
  addCommand: string;
  dlxCommand: string;
  createCommand: string;
  ciCommand: string;
};

export const storageKey = "packagePickerSettings";
export const disabledPresetId = "disabled";

export const defaultSettings: PackagePickerSettings = {
  presetId: "pnpm"
};

export function normalizeSettings(value: unknown): PackagePickerSettings {
  if (!isRecord(value)) {
    return { ...defaultSettings };
  }

  if (value.enabled === false) {
    return { presetId: disabledPresetId };
  }

  return {
    presetId: normalizePresetId(value.presetId)
  };
}

export function resolvePackageManager(settings: PackagePickerSettings): EffectivePackageManager {
  const preset = getPreset(settings.presetId);

  if (!preset) {
    return resolvePackageManager(defaultSettings);
  }

  return {
    label: preset.label,
    installCommand: preset.installCommand,
    addCommand: preset.addCommand,
    dlxCommand: preset.dlxCommand,
    createCommand: preset.createCommand,
    ciCommand: preset.ciCommand
  };
}

export function isRewriteEnabled(settings: PackagePickerSettings): boolean {
  return settings.presetId !== disabledPresetId;
}

export function presetIds(): string[] {
  return [disabledPresetId, ...packageManagerPresets.map((preset) => preset.id)];
}

function normalizePresetId(value: unknown): string {
  if (typeof value !== "string") {
    return defaultSettings.presetId;
  }

  return presetIds().includes(value) ? value : defaultSettings.presetId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
