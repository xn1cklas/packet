import { packageManagerPresets } from "../shared/package-managers";
import { defaultSettings, normalizeSettings, type PackagePickerSettings } from "../shared/settings";
import { readSettings, writeSettings } from "../shared/storage";

type SettingsFormElements = {
  form: HTMLFormElement;
  enabled: HTMLInputElement;
  presetId: HTMLSelectElement;
  customFields: HTMLElement;
  customLabel: HTMLInputElement;
  customInstallCommand: HTMLInputElement;
  customAddCommand: HTMLInputElement;
  customDlxCommand: HTMLInputElement;
  customCreateCommand: HTMLInputElement;
  customCiCommand: HTMLInputElement;
  status: HTMLElement;
  reset: HTMLButtonElement;
};

export async function mountSettingsForm(documentRoot: Document): Promise<void> {
  const elements = getElements(documentRoot);
  populatePresetOptions(elements.presetId);

  const settings = await readSettings();
  render(elements, settings);

  elements.form.addEventListener("input", () => {
    void persist(elements);
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    void persist(elements);
  });

  elements.reset.addEventListener("click", () => {
    render(elements, defaultSettings);
    void persist(elements);
  });
}

function getElements(documentRoot: Document): SettingsFormElements {
  return {
    form: requiredElement(documentRoot, "settings-form", HTMLFormElement),
    enabled: requiredElement(documentRoot, "enabled", HTMLInputElement),
    presetId: requiredElement(documentRoot, "preset-id", HTMLSelectElement),
    customFields: requiredElement(documentRoot, "custom-fields", HTMLElement),
    customLabel: requiredElement(documentRoot, "custom-label", HTMLInputElement),
    customInstallCommand: requiredElement(documentRoot, "custom-install-command", HTMLInputElement),
    customAddCommand: requiredElement(documentRoot, "custom-add-command", HTMLInputElement),
    customDlxCommand: requiredElement(documentRoot, "custom-dlx-command", HTMLInputElement),
    customCreateCommand: requiredElement(documentRoot, "custom-create-command", HTMLInputElement),
    customCiCommand: requiredElement(documentRoot, "custom-ci-command", HTMLInputElement),
    status: requiredElement(documentRoot, "status", HTMLElement),
    reset: requiredElement(documentRoot, "reset", HTMLButtonElement)
  };
}

function populatePresetOptions(select: HTMLSelectElement): void {
  select.replaceChildren();

  for (const preset of packageManagerPresets) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    select.append(option);
  }

  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Custom";
  select.append(custom);
}

function render(elements: SettingsFormElements, settings: PackagePickerSettings): void {
  elements.enabled.checked = settings.enabled;
  elements.presetId.value = settings.presetId;
  elements.customLabel.value = settings.customLabel;
  elements.customInstallCommand.value = settings.customInstallCommand;
  elements.customAddCommand.value = settings.customAddCommand;
  elements.customDlxCommand.value = settings.customDlxCommand;
  elements.customCreateCommand.value = settings.customCreateCommand;
  elements.customCiCommand.value = settings.customCiCommand;
  renderCustomFields(elements);
}

async function persist(elements: SettingsFormElements): Promise<void> {
  const settings = readForm(elements);
  renderCustomFields(elements);

  try {
    await writeSettings(settings);
    setStatus(elements.status, "Saved");
  } catch (error) {
    setStatus(elements.status, error instanceof Error ? error.message : "Unable to save");
  }
}

function readForm(elements: SettingsFormElements): PackagePickerSettings {
  return normalizeSettings({
    enabled: elements.enabled.checked,
    presetId: elements.presetId.value,
    customLabel: elements.customLabel.value,
    customInstallCommand: elements.customInstallCommand.value,
    customAddCommand: elements.customAddCommand.value,
    customDlxCommand: elements.customDlxCommand.value,
    customCreateCommand: elements.customCreateCommand.value,
    customCiCommand: elements.customCiCommand.value
  });
}

function renderCustomFields(elements: SettingsFormElements): void {
  elements.customFields.hidden = elements.presetId.value !== "custom";
}

function setStatus(element: HTMLElement, text: string): void {
  element.textContent = text;
  window.setTimeout(() => {
    if (element.textContent === text) {
      element.textContent = "";
    }
  }, 1800);
}

function requiredElement<T extends typeof HTMLElement>(
  documentRoot: Document,
  id: string,
  elementType: T
): InstanceType<T> {
  const element = documentRoot.getElementById(id);
  if (!(element instanceof elementType)) {
    throw new Error(`Missing #${id}`);
  }

  return element as InstanceType<T>;
}
