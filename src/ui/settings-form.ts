import { packageManagerPresets } from "../shared/package-managers";
import {
  disabledPresetId,
  normalizeSettings,
  type PackagePickerSettings
} from "../shared/settings";
import { readSettings, writeSettings } from "../shared/storage";

type SettingsFormElements = {
  form: HTMLFormElement;
  presetId: HTMLSelectElement;
  status: HTMLElement;
};

export async function mountSettingsForm(documentRoot: Document): Promise<void> {
  const elements = getElements(documentRoot);
  populatePresetOptions(elements.presetId);

  const settings = await readSettings();
  render(elements, settings);

  elements.presetId.addEventListener("change", () => {
    void persist(elements);
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    void persist(elements);
  });
}

function getElements(documentRoot: Document): SettingsFormElements {
  return {
    form: requiredElement(documentRoot, "settings-form", HTMLFormElement),
    presetId: requiredElement(documentRoot, "preset-id", HTMLSelectElement),
    status: requiredElement(documentRoot, "status", HTMLElement)
  };
}

function populatePresetOptions(select: HTMLSelectElement): void {
  select.replaceChildren();

  const disabled = document.createElement("option");
  disabled.value = disabledPresetId;
  disabled.textContent = "Disabled";
  select.append(disabled);

  for (const preset of packageManagerPresets) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    select.append(option);
  }
}

function render(elements: SettingsFormElements, settings: PackagePickerSettings): void {
  elements.presetId.value = settings.presetId;
}

async function persist(elements: SettingsFormElements): Promise<void> {
  const settings = readForm(elements);

  try {
    await writeSettings(settings);
    setStatus(elements.status, "Saved");
  } catch (error) {
    setStatus(elements.status, error instanceof Error ? error.message : "Unable to save");
  }
}

function readForm(elements: SettingsFormElements): PackagePickerSettings {
  return normalizeSettings({
    presetId: elements.presetId.value
  });
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
