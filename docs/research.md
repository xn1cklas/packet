# Chrome Extension Research Notes

Sources checked during implementation:

- Chrome content script docs: static declarations are appropriate for code that should run automatically on known URL patterns, and content scripts can read and modify page DOM.
- Chrome storage docs: `storage.sync` is recommended for user settings that should follow the signed-in Chrome profile.
- Chrome Web Store best practices: optimize for security, privacy, performance, and user experience.
- Chrome MV3 CSP docs: extension pages cannot relax script policy to allow remote code or unsafe eval.
- Open-source extension templates such as `chrome-extension-boilerplate-react-vite`, `chrome-ext-starter`, and `webext-options-sync` favor typed shared settings, build-time bundling, explicit options defaults, and reusable storage helpers.

Project decisions:

- Use a small TypeScript + esbuild pipeline instead of React. The UI is simple enough that React would add weight without reducing complexity.
- Bundle each extension entry into one local file. This avoids content-script module/chunk loading edge cases.
- Keep settings in a shared pure TypeScript module used by popup, options, content script, and tests.
- Avoid a service worker until a real background event boundary exists.

## Preset Verification

The bundled presets intentionally cover the established Node package-manager set plus the two newer tools requested for this extension:

| Preset | Add dependency      | Install dependencies | Run package / npx replacement | Notes                                                                                            |
| ------ | ------------------- | -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| npm    | `npm install <pkg>` | `npm install`        | `npx <pkg>`                   | Standard Node package manager.                                                                   |
| pnpm   | `pnpm add <pkg>`    | `pnpm install`       | `pnpm dlx <pkg>`              | `pnpm dlx` is documented as an alias of `pnx`; we use the explicit package-manager form.         |
| yarn   | `yarn add <pkg>`    | `yarn install`       | `yarn dlx <pkg>`              | Uses modern Yarn's one-off package runner.                                                       |
| bun    | `bun add <pkg>`     | `bun install`        | `bunx <pkg>`                  | Bun documents `bunx` as its `npx` / `yarn dlx` equivalent.                                       |
| nub    | `nub add <pkg>`     | `nub install`        | `nubx <pkg>`                  | Nub documents `nubx` and a pnpm-compatible package manager powered by Aube.                      |
| aube   | `aube add <pkg>`    | `aube install`       | `aubx <pkg>`                  | Aube installation docs wire up `aube`, `aubr`, and `aubx`; `aubx` is the one-off package runner. |

Deno is increasingly package-manager-like for npm and JSR packages, but it is not bundled as a preset here because its `npx` equivalent is not a simple drop-in command rewrite for Node documentation examples.
