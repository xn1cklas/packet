import { expect, test, chromium, type BrowserContext, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test.describe("Packet extension smoke", () => {
  let context: BrowserContext | undefined;
  let userDataDir: string | undefined;

  test.afterEach(async () => {
    await context?.close();
    context = undefined;

    const directory = userDataDir;
    if (directory) {
      await rm(directory, { recursive: true, force: true });
      userDataDir = undefined;
    }
  });

  test("rewrites npm install and npx snippets on Next.js documentation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "packet-"));
    userDataDir = directory;
    context = await launchChromeWithExtension(directory);

    const page = await context.newPage();
    await page.goto("https://nextjs.org/docs/13/getting-started/installation", {
      waitUntil: "domcontentloaded"
    });

    await expect
      .poll(async () =>
        page.getByText("pnpm add next@latest react@latest react-dom@latest").count()
      )
      .toBeGreaterThan(0);

    await page.goto("https://nextjs.org/docs/13/pages/api-reference/next-cli", {
      waitUntil: "domcontentloaded"
    });

    await expect.poll(async () => page.getByText("pnpm dlx next -h").count()).toBeGreaterThan(0);
  });

  test("updates existing rewritten snippets when the selected manager changes", async ({
    page
  }) => {
    await page.addInitScript(() => {
      const storageKey = "packagePickerSettings";
      const listeners: ((
        changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
        areaName: string
      ) => void)[] = [];
      let settings = { presetId: "pnpm" };

      const setPresetSilently = (presetId: string) => {
        settings = { presetId };
      };

      const setPreset = (presetId: string) => {
        const oldValue = settings;
        settings = { presetId };
        const change = { [storageKey]: { oldValue, newValue: settings } };

        for (const listener of listeners) {
          listener(change, "sync");
        }
      };

      Object.assign(window, {
        __packetStorage: { setPreset, setPresetSilently },
        chrome: {
          runtime: {},
          storage: {
            sync: {
              get(defaults: Record<string, unknown>, callback: (items: unknown) => void) {
                callback({ ...defaults, [storageKey]: settings });
              },
              set(items: Record<string, unknown>, callback?: () => void) {
                const nextSettings = items[storageKey];
                if (
                  typeof nextSettings === "object" &&
                  nextSettings !== null &&
                  "presetId" in nextSettings &&
                  typeof nextSettings.presetId === "string"
                ) {
                  setPreset(nextSettings.presetId);
                }
                callback?.();
              }
            },
            onChanged: {
              addListener(listener: (typeof listeners)[number]) {
                listeners.push(listener);
              }
            }
          }
        }
      });
    });

    await page.goto(
      `data:text/html,${encodeURIComponent(`
        <main>
          <pre><code><span class="line"><span>npm</span><span> install</span><span> left-pad</span></span></code></pre>
          <p id="plain">npm install cowsay</p>
        </main>
      `)}`
    );

    const urlBeforeUpdate = page.url();
    const highlightedCommand = page.locator(".line");
    const plainCommand = page.locator("#plain");

    await page.addScriptTag({ path: resolve("dist/content.js") });

    await expect(highlightedCommand).toHaveText("pnpm add left-pad");
    await expect(plainCommand).toHaveText("pnpm add cowsay");

    await setPreset(page, "bun");
    await expect(highlightedCommand).toHaveText("bun add left-pad");
    await expect(plainCommand).toHaveText("bun add cowsay");
    expect(page.url()).toBe(urlBeforeUpdate);

    await setPreset(page, "disabled");
    await expect(highlightedCommand).toHaveText("npm install left-pad");
    await expect(plainCommand).toHaveText("npm install cowsay");
    expect(page.url()).toBe(urlBeforeUpdate);

    await setPreset(page, "yarn");
    await expect(highlightedCommand).toHaveText("yarn add left-pad");
    await expect(plainCommand).toHaveText("yarn add cowsay");
    expect(page.url()).toBe(urlBeforeUpdate);

    await setPresetSilently(page, "aube");
    await page.addScriptTag({ path: resolve("dist/content.js") });
    await expect(highlightedCommand).toHaveText("aube add left-pad");
    await expect(plainCommand).toHaveText("aube add cowsay");
    expect(page.url()).toBe(urlBeforeUpdate);
  });
});

async function setPreset(page: Page, presetId: string) {
  await page.evaluate((nextPresetId) => {
    const packetWindow = window as unknown as {
      __packetStorage: { setPreset(presetId: string): void };
    };

    packetWindow.__packetStorage.setPreset(nextPresetId);
  }, presetId);
}

async function setPresetSilently(page: Page, presetId: string) {
  await page.evaluate((nextPresetId) => {
    const packetWindow = window as unknown as {
      __packetStorage: { setPresetSilently(presetId: string): void };
    };

    packetWindow.__packetStorage.setPresetSilently(nextPresetId);
  }, presetId);
}

async function launchChromeWithExtension(userDataDir: string): Promise<BrowserContext> {
  const extensionPath = resolve("dist");
  const options = {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-first-run",
      "--no-default-browser-check"
    ]
  };

  const channel = process.env.PLAYWRIGHT_CHROME_CHANNEL;
  if (channel) {
    return chromium.launchPersistentContext(userDataDir, {
      ...options,
      channel
    });
  }

  return chromium.launchPersistentContext(userDataDir, options);
}
