import { getPreset, packageManagerPresets } from "./package-managers";

export type PackagePickerSettings = {
  enabled: boolean;
  presetId: string;
  customLabel: string;
  customInstallCommand: string;
  customAddCommand: string;
  customDlxCommand: string;
  customCreateCommand: string;
  customCiCommand: string;
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

export const defaultSettings: PackagePickerSettings = {
  enabled: true,
  presetId: "pnpm",
  customLabel: "custom",
  customInstallCommand: "custom install",
  customAddCommand: "custom add",
  customDlxCommand: "customx",
  customCreateCommand: "custom create",
  customCiCommand: "custom ci"
};

export function normalizeSettings(value: unknown): PackagePickerSettings {
  if (!isRecord(value)) {
    return { ...defaultSettings };
  }

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : defaultSettings.enabled,
    presetId: normalizePresetId(value.presetId),
    customLabel: normalizeCommandPart(value.customLabel, defaultSettings.customLabel),
    customInstallCommand: normalizeCommandPart(
      value.customInstallCommand,
      defaultSettings.customInstallCommand
    ),
    customAddCommand: normalizeCommandPart(
      value.customAddCommand,
      defaultSettings.customAddCommand
    ),
    customDlxCommand: normalizeCommandPart(
      value.customDlxCommand,
      defaultSettings.customDlxCommand
    ),
    customCreateCommand: normalizeCommandPart(
      value.customCreateCommand,
      defaultSettings.customCreateCommand
    ),
    customCiCommand: normalizeCommandPart(value.customCiCommand, defaultSettings.customCiCommand)
  };
}

export function resolvePackageManager(settings: PackagePickerSettings): EffectivePackageManager {
  const preset = getPreset(settings.presetId);

  if (preset) {
    return {
      label: preset.label,
      installCommand: preset.installCommand,
      addCommand: preset.addCommand,
      dlxCommand: preset.dlxCommand,
      createCommand: preset.createCommand,
      ciCommand: preset.ciCommand
    };
  }

  return {
    label: settings.customLabel,
    installCommand: settings.customInstallCommand,
    addCommand: settings.customAddCommand,
    dlxCommand: settings.customDlxCommand,
    createCommand: settings.customCreateCommand,
    ciCommand: settings.customCiCommand
  };
}

export function presetIds(): string[] {
  return [...packageManagerPresets.map((preset) => preset.id), "custom"];
}

function normalizePresetId(value: unknown): string {
  if (typeof value !== "string") {
    return defaultSettings.presetId;
  }

  return presetIds().includes(value) ? value : defaultSettings.presetId;
}

function normalizeCommandPart(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
