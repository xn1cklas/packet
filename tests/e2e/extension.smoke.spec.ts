import { expect, test, chromium, type BrowserContext } from "@playwright/test";
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
});

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
