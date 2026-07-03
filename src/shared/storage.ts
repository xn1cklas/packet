import {
  defaultSettings,
  normalizeSettings,
  storageKey,
  type PackagePickerSettings
} from "./settings";

type StoragePayload = {
  [storageKey]: PackagePickerSettings;
};

export function readSettings(): Promise<PackagePickerSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ [storageKey]: defaultSettings }, (items: Partial<StoragePayload>) => {
      resolve(normalizeSettings(items[storageKey]));
    });
  });
}

export function writeSettings(settings: PackagePickerSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [storageKey]: settings }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}
