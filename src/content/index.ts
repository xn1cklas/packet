import { DomCommandRewriter } from "./dom-rewriter";
import { readSettings } from "../shared/storage";
import { normalizeSettings, storageKey } from "../shared/settings";

type PacketContentState = {
  refresh?: () => void;
  started?: boolean;
};

const packetGlobal = globalThis as unknown as {
  __packetContentState?: PacketContentState;
};
const packetContentState = (packetGlobal.__packetContentState ??= {});
let scheduled = false;

if (packetContentState.started) {
  packetContentState.refresh?.();
} else {
  packetContentState.started = true;
  void start(packetContentState);
}

async function start(state: PacketContentState): Promise<void> {
  const startup = await readSettings();
  const rewriter = new DomCommandRewriter(startup);

  state.refresh = () => {
    void readSettings().then((settings) => {
      rewriter.updateSettings(settings);
    });
  };

  rewriteSoon();

  const observer = new MutationObserver((mutations) => {
    if (
      !mutations.some(
        (mutation) => mutation.type === "childList" || mutation.type === "characterData"
      )
    ) {
      return;
    }

    rewriteSoon();
  });

  observer.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    const changed = changes[storageKey];
    if (!changed) {
      return;
    }

    rewriter.updateSettings(normalizeSettings(changed.newValue));
  });

  function rewriteSoon(): void {
    if (scheduled) {
      return;
    }

    scheduled = true;
    scheduleIdle(() => {
      scheduled = false;
      rewriter.rewrite(document.body);
    });
  }
}

function scheduleIdle(callback: () => void): void {
  const requestIdleCallback = window.requestIdleCallback;
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(callback, { timeout: 500 });
    return;
  }

  globalThis.setTimeout(callback, 50);
}
